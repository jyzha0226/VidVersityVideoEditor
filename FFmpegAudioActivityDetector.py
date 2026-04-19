import os
import subprocess
import wave
from dataclasses import dataclass
from typing import List, Optional, Protocol, Tuple


# =========================================================
# Data Structures / 数据结构
# =========================================================

@dataclass
class AudioSegment:
    """
    Represents one detected audio segment.

    表示一个检测到的音频片段
    """
    start_time: float                      # Segment start time in seconds / 片段开始时间（秒）
    end_time: float                        # Segment end time in seconds / 片段结束时间（秒）
    label: str                             # "speech" or "silence" / 标签：speech 或 silence
    confidence: Optional[float] = None     # Optional confidence score / 可选置信度


@dataclass
class DetectionResult:
    """
    Stores the final detection result.

    存储最终检测结果
    """
    speech_segments: List[AudioSegment]     # Detected speech segments / 检测到的语音片段
    silence_segments: List[AudioSegment]    # Detected silence segments / 检测到的静音片段
    audio_duration: float                   # Total duration of audio / 音频总时长（秒）


# =========================================================
# Interface Definition / 接口定义
# =========================================================

class AudioActivityDetector(Protocol):


    def load_audio(self, audio_path: str) -> str:
        """
        Convert raw audio into a standard WAV file.

        将原始音频转换为统一标准格式 WAV 文件
        """
        ...

    def get_audio_duration(self, audio_path: str) -> float:
        """
        Get audio duration in seconds.

        获取音频时长（秒）
        """
        ...

    def detect_silence_segments(
        self,
        speech_segments: List[AudioSegment],
        audio_duration: float
    ) -> List[AudioSegment]:
        """
        Infer silence segments from speech complement (gaps vs total duration).

        由语音片段在全时长上的补集得到静音片段
        """
        ...

    def detect_speech_segments(
        self,
        standard_audio_path: str,
        audio_duration: float
    ) -> List[AudioSegment]:
        """
        Detect speech segments from standard audio.

        从标准化后的音频中检测语音片段
        """
        ...

    def process(self, audio_path: str) -> DetectionResult:
        """
        Run the full pipeline.

        执行完整检测流程
        """
        ...


# =========================================================
# Implementation / 具体实现
# =========================================================

class FFmpegAudioActivityDetector:
    """
    Audio activity detector: ffmpeg preprocessing + Silero VAD.

    音频活动检测：ffmpeg 预处理 + Silero VAD

    Current design / 当前设计：
    1. load_audio()
       -> Use ffmpeg to standardize audio into mono 16kHz WAV
       -> 使用 ffmpeg 将音频统一转换为单声道、16kHz 的 WAV

    2. detect_speech_segments()
       -> Silero VAD (via torch.hub)
       -> Silero 语音端点检测

    3. detect_silence_segments()
       -> Gaps between speech segments vs total duration (complement)
       -> 由 speech 在全时长上的补集得到静音区间

    4. process()
       -> Main pipeline interface for teammates / 提供给组员调用的主入口
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        temp_dir: str = "temp_audio",
        vad_threshold: float = 0.5,
        min_speech_duration_ms: int = 250,
        min_silence_duration_ms: int = 100,
        speech_pad_ms: int = 30,
        min_segment_duration: float = 0.1
    ):
        """
        Initialize detector.

        初始化检测器

        Parameters / 参数说明：
        - sample_rate:
          target sample rate (Silero 支持 8000 / 16000，默认 16000)
        - temp_dir:
          folder to store converted WAV files / 存放转换后 WAV 文件的目录
        - vad_threshold:
          Silero VAD 概率阈值，越大越“保守”（更少判为语音）
        - min_speech_duration_ms / min_silence_duration_ms / speech_pad_ms:
          传给 Silero get_speech_timestamps 的合并与边界参数
        - min_segment_duration:
          输出前过滤过短的 speech / silence 片段（秒）
        """
        self.sample_rate = sample_rate
        self.temp_dir = temp_dir
        self.vad_threshold = vad_threshold
        self.min_speech_duration_ms = min_speech_duration_ms
        self.min_silence_duration_ms = min_silence_duration_ms
        self.speech_pad_ms = speech_pad_ms
        self.min_segment_duration = min_segment_duration

        self._silero_model = None
        self._silero_get_speech_timestamps = None

        os.makedirs(self.temp_dir, exist_ok=True)

    # ---------------------------------------------------------
    # Interface 1: Audio preprocessing
    # 接口1：音频预处理
    # ---------------------------------------------------------
    def load_audio(self, audio_path: str) -> str:
        """
        [Interface for audio preprocessing / 音频预处理接口]

        Purpose / 作用：
        Convert any input audio into a standard WAV file
        so later detection logic can work on a consistent format.

        将任意输入音频转换为统一格式，
        方便后续 silence / speech detection 稳定工作。

        Input / 输入：
        - audio_path: original audio file path / 原始音频路径

        Output / 输出：
        - standard_audio_path: converted WAV path / 标准 WAV 文件路径

        Used by / 调用方：
        - process()

        Notes / 备注：
        - This function only does preprocessing with ffmpeg.
        - It does NOT detect speech or silence.
        - 该函数只负责预处理，不负责检测。
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        output_path = os.path.join(self.temp_dir, f"{base_name}_standard.wav")

        command = [
            "ffmpeg",
            "-y",                       # overwrite output / 覆盖输出文件
            "-i", audio_path,           # input file / 输入文件
            "-ac", "1",                 # mono / 单声道
            "-ar", str(self.sample_rate),  # resample / 重采样
            "-vn",                      # disable video / 忽略视频轨道
            output_path
        ]

        try:
            subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
        except FileNotFoundError:
            raise RuntimeError(
                "ffmpeg is not installed or not added to PATH. "
                "Please install ffmpeg first."
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg audio conversion failed:\n{e.stderr}")

        return output_path

    # ---------------------------------------------------------
    # Helper: get duration
    # 辅助函数：获取音频时长
    # ---------------------------------------------------------
    def get_audio_duration(self, audio_path: str) -> float:
        """
        [Interface for duration reading / 获取音频时长接口]

        Purpose / 作用：
        Read total duration of audio in seconds.

        读取音频总时长（秒）

        Input / 输入：
        - audio_path: standardized WAV path / 标准化 WAV 路径

        Output / 输出：
        - duration in seconds / 秒数

        Used by / 调用方：
        - process()
        - detect_speech_segments()

        Notes / 备注：
        Uses ffprobe.
        使用 ffprobe 获取时长。
        """
        command = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]

        try:
            result = subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return float(result.stdout.strip())
        except FileNotFoundError:
            raise RuntimeError(
                "ffprobe is not installed or not added to PATH. "
                "Please install ffmpeg/ffprobe first."
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffprobe failed:\n{e.stderr}")
        except ValueError:
            raise RuntimeError("Unable to parse audio duration from ffprobe output.")

    # ---------------------------------------------------------
    # Interface 2: silence detection (complement of speech)
    # 接口2：静音检测（由语音补集得到）
    # ---------------------------------------------------------
    def detect_silence_segments(
        self,
        speech_segments: List[AudioSegment],
        audio_duration: float
    ) -> List[AudioSegment]:
        """
        [Interface for silence detection / 静音检测接口]

        Purpose / 作用：
        Build silence segments as the complement of speech within [0, audio_duration].

        在 [0, audio_duration] 上，用 speech 片段的补集构造静音片段。

        Input / 输入：
        - speech_segments: VAD 得到的语音片段
        - audio_duration: 总时长（秒）

        Output / 输出：
        - List[AudioSegment], label="silence"

        Used by / 调用方：
        - process()
        """
        silence_segments = self._silence_complement(speech_segments, audio_duration)
        return self._filter_short_segments(silence_segments)

    # ---------------------------------------------------------
    # Interface 3: speech detection
    # 接口3：语音检测
    # ---------------------------------------------------------
    def detect_speech_segments(
        self,
        standard_audio_path: str,
        audio_duration: float
    ) -> List[AudioSegment]:
        """
        [Interface for speech activity detection / 语音活动检测接口]

        Purpose / 作用：
        Detect speech activity with Silero VAD.

        使用 Silero VAD 检测语音活动片段。

        Input / 输入：
        - standard_audio_path: 标准化后的单声道 16kHz WAV
        - audio_duration: ffprobe 得到的总时长，用于裁剪边界

        Output / 输出：
        - List[AudioSegment], label="speech"

        Used by / 调用方：
        - process()

        Dependencies / 依赖：
        - torch, torchaudio（torch.hub 加载 silero-vad 时需要）
        - 首次运行需联网以下载 hub 模型
        """
        model, get_speech_timestamps = self._ensure_silero_vad()
        wav = self._read_standard_wav_tensor(standard_audio_path)

        timestamps = get_speech_timestamps(
            wav,
            model,
            threshold=self.vad_threshold,
            sampling_rate=self.sample_rate,
            min_speech_duration_ms=self.min_speech_duration_ms,
            min_silence_duration_ms=self.min_silence_duration_ms,
            speech_pad_ms=self.speech_pad_ms,
            return_seconds=True,
        )

        speech_segments: List[AudioSegment] = []
        for t in timestamps:
            start = max(0.0, float(t["start"]))
            end = min(audio_duration, float(t["end"]))
            if end > start:
                speech_segments.append(
                    AudioSegment(
                        start_time=start,
                        end_time=end,
                        label="speech",
                        confidence=None,
                    )
                )

        return self._filter_short_segments(speech_segments)

    # ---------------------------------------------------------
    # Interface 4: main pipeline
    # 接口4：主流程入口
    # ---------------------------------------------------------
    def process(self, audio_path: str) -> DetectionResult:
        """
        [Main pipeline interface / 主流程接口]

        Purpose / 作用：
        This is the main function teammates should call.

        这是推荐给组员直接调用的主入口函数。

        Pipeline / 流程：
        1. Convert raw input audio using ffmpeg
        2. Get total audio duration
        3. Silero VAD -> speech segments
        4. Complement -> silence segments
        5. Return DetectionResult

        1. 使用 ffmpeg 预处理音频
        2. 获取音频总时长
        3. Silero VAD 检测语音片段
        4. 由补集得到静音片段
        5. 返回最终结果

        Input / 输入：
        - audio_path: original audio file path / 原始音频路径

        Output / 输出：
        - DetectionResult

        Used by / 调用方：
        - UI
        - backend
        - testing scripts
        - teammates

        Why this matters / 为什么重要：
        Teammates do not need to know the internal details.
        They can simply call process() and get structured results.

        组员不需要关心 ffmpeg、正则解析等内部细节，
        只需要调用 process() 即可获得结构化结果。
        """
        standard_audio_path = self.load_audio(audio_path)
        audio_duration = self.get_audio_duration(standard_audio_path)
        speech_segments = self.detect_speech_segments(
            standard_audio_path=standard_audio_path,
            audio_duration=audio_duration,
        )
        silence_segments = self.detect_silence_segments(
            speech_segments=speech_segments,
            audio_duration=audio_duration,
        )

        return DetectionResult(
            speech_segments=speech_segments,
            silence_segments=silence_segments,
            audio_duration=audio_duration
        )

    # =========================================================
    # Internal Helpers / 内部辅助函数
    # =========================================================

    def _ensure_silero_vad(self) -> Tuple[object, object]:
        if self._silero_model is not None and self._silero_get_speech_timestamps is not None:
            return self._silero_model, self._silero_get_speech_timestamps

        import torch

        model, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            trust_repo=True,
        )
        get_speech_timestamps = utils[0]
        self._silero_model = model
        self._silero_get_speech_timestamps = get_speech_timestamps
        return model, get_speech_timestamps

    def _read_standard_wav_tensor(self, standard_audio_path: str):
        """
        Load mono 16-bit PCM WAV as float32 tensor in [-1, 1] for Silero.
        使用标准库读取 WAV，避免依赖 torchaudio.load 的后端差异。
        """
        import torch

        with wave.open(standard_audio_path, "rb") as wf:
            if wf.getnchannels() != 1:
                raise ValueError(
                    f"Expected mono WAV after load_audio: {standard_audio_path}"
                )
            if wf.getsampwidth() != 2:
                raise ValueError(
                    f"Expected 16-bit PCM WAV after load_audio: {standard_audio_path}"
                )
            if wf.getframerate() != self.sample_rate:
                raise ValueError(
                    f"Expected {self.sample_rate} Hz WAV, got {wf.getframerate()}: "
                    f"{standard_audio_path}"
                )
            nframes = wf.getnframes()
            raw = wf.readframes(nframes)

        # frombuffer 需要可写缓冲区以便部分 torch 版本安全使用
        pcm = torch.frombuffer(bytearray(raw), dtype=torch.int16)
        return pcm.float() / 32768.0

    def _silence_complement(
        self,
        speech_segments: List[AudioSegment],
        audio_duration: float,
    ) -> List[AudioSegment]:
        """Gaps between sorted speech intervals within [0, audio_duration]."""
        if audio_duration <= 0:
            return []

        if not speech_segments:
            return [
                AudioSegment(
                    start_time=0.0,
                    end_time=audio_duration,
                    label="silence",
                    confidence=None,
                )
            ]

        ordered = sorted(speech_segments, key=lambda s: s.start_time)
        silence: List[AudioSegment] = []
        cursor = 0.0

        for seg in ordered:
            if seg.start_time > cursor:
                silence.append(
                    AudioSegment(
                        start_time=cursor,
                        end_time=seg.start_time,
                        label="silence",
                        confidence=None,
                    )
                )
            cursor = max(cursor, seg.end_time)

        if cursor < audio_duration:
            silence.append(
                AudioSegment(
                    start_time=cursor,
                    end_time=audio_duration,
                    label="silence",
                    confidence=None,
                )
            )

        return silence

    def _filter_short_segments(self, segments: List[AudioSegment]) -> List[AudioSegment]:
        """
        Remove segments shorter than min_segment_duration.

        移除太短的片段
        """
        filtered = []
        for seg in segments:
            if (seg.end_time - seg.start_time) >= self.min_segment_duration:
                filtered.append(seg)
        return filtered


# =========================================================
# Post-processing: merge & clean segments
# 后处理：合并相邻片段、剔除过短片段
# =========================================================

def _merge_confidence(
    a: Optional[float],
    b: Optional[float],
) -> Optional[float]:
    if a is None and b is None:
        return None
    if a is None:
        return b
    if b is None:
        return a
    return max(a, b)


def merge_close_speech_segments(
    segments: List[AudioSegment],
    max_gap_sec: float,
) -> List[AudioSegment]:
    """
    Merge adjacent speech segments when the gap between them is at most max_gap_sec
    (also merges overlaps: gap < 0).

    将间隔不超过 max_gap_sec 的相邻 speech 合并（重叠区间也会合并）
    """
    speech = [s for s in segments if s.label == "speech"]
    if len(speech) <= 1:
        return sorted(speech, key=lambda s: s.start_time)

    ordered = sorted(speech, key=lambda s: s.start_time)
    merged: List[AudioSegment] = [ordered[0]]
    for seg in ordered[1:]:
        last = merged[-1]
        gap = seg.start_time - last.end_time
        if gap <= max_gap_sec:
            merged[-1] = AudioSegment(
                start_time=last.start_time,
                end_time=max(last.end_time, seg.end_time),
                label="speech",
                confidence=_merge_confidence(last.confidence, seg.confidence),
            )
        else:
            merged.append(seg)
    return merged


def merge_close_silence_segments(
    segments: List[AudioSegment],
    max_gap_sec: float,
) -> List[AudioSegment]:
    """
    Merge adjacent silence segments when the gap between them is at most max_gap_sec.

    将间隔不超过 max_gap_sec 的相邻 silence 合并
    """
    silence = [s for s in segments if s.label == "silence"]
    if len(silence) <= 1:
        return sorted(silence, key=lambda s: s.start_time)

    ordered = sorted(silence, key=lambda s: s.start_time)
    merged: List[AudioSegment] = [ordered[0]]
    for seg in ordered[1:]:
        last = merged[-1]
        gap = seg.start_time - last.end_time
        if gap <= max_gap_sec:
            merged[-1] = AudioSegment(
                start_time=last.start_time,
                end_time=max(last.end_time, seg.end_time),
                label="silence",
                confidence=_merge_confidence(last.confidence, seg.confidence),
            )
        else:
            merged.append(seg)
    return merged


def remove_short_speech_segments(
    segments: List[AudioSegment],
    min_duration_sec: float,
) -> List[AudioSegment]:
    """
    Drop speech segments shorter than min_duration_sec.

    移除时长小于 min_duration_sec 的 speech 片段
    """
    out: List[AudioSegment] = []
    for seg in segments:
        if seg.label != "speech":
            continue
        if (seg.end_time - seg.start_time) >= min_duration_sec:
            out.append(seg)
    return out


def remove_short_silence_segments(
    segments: List[AudioSegment],
    min_duration_sec: float,
) -> List[AudioSegment]:
    """
    Drop silence segments shorter than min_duration_sec.

    移除时长小于 min_duration_sec 的 silence 片段
    """
    out: List[AudioSegment] = []
    for seg in segments:
        if seg.label != "silence":
            continue
        if (seg.end_time - seg.start_time) >= min_duration_sec:
            out.append(seg)
    return out


# =========================================================
# Example usage / 示例用法
# =========================================================

def print_segments(title: str, segments: List[AudioSegment]) -> None:
    """
    Pretty print segments.

    格式化输出片段
    """
    print(f"\n{title}")
    if not segments:
        print("  (none)")
        return

    for seg in segments:
        duration = seg.end_time - seg.start_time
        print(
            f"  {seg.start_time:.2f}s -> {seg.end_time:.2f}s "
            f"| duration={duration:.2f}s | label={seg.label} | confidence={seg.confidence}"
        )


if __name__ == "__main__":
    # -----------------------------------------------------
    # Example configuration / 示例配置
    # -----------------------------------------------------
    detector = FFmpegAudioActivityDetector(
        sample_rate=16000,
        temp_dir="temp_audio",
        vad_threshold=0.5,
        min_speech_duration_ms=250,
        min_silence_duration_ms=100,
        speech_pad_ms=30,
        min_segment_duration=0.1,
    )

    # Replace this with your actual file path
    # 替换为你的真实音频路径
    input_audio = "example.mp3"

    try:
        result = detector.process(input_audio)

        print(f"Audio duration / 音频总时长: {result.audio_duration:.2f}s")

        print_segments("Silence Segments / 静音片段", result.silence_segments)
        print_segments("Speech Activity Segments / 语音活动片段", result.speech_segments)

    except Exception as e:
        print(f"[ERROR] {e}")
