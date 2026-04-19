import os
import re
import subprocess
from dataclasses import dataclass
from typing import List, Optional, Protocol


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

    def detect_silence_segments(self, standard_audio_path: str) -> List[AudioSegment]:
        """
        Detect silence segments from standard audio.

        从标准化后的音频中检测静音片段
        """
        ...

    def detect_speech_segments(
        self,
        standard_audio_path: str,
        silence_segments: List[AudioSegment],
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
    Audio activity detector based on ffmpeg.

    基于 ffmpeg 的音频活动检测器

    Current design / 当前设计：
    1. load_audio()
       -> Use ffmpeg to standardize audio into mono 16kHz WAV
       -> 使用 ffmpeg 将音频统一转换为单声道、16kHz 的 WAV

    2. detect_silence_segments()
       -> Use ffmpeg silencedetect filter
       -> 使用 ffmpeg 的 silencedetect 检测静音区间

    3. detect_speech_segments()
       -> Infer speech segments from non-silence intervals
       -> 通过“非静音区间”反推 speech segments

    4. process()
       -> Main pipeline interface for teammates / 提供给组员调用的主入口

    Important note / 重要说明：
    This version does NOT use a true speech model.
    It treats non-silence as speech-like activity.
    当前版本不使用真实的人声模型，
    而是把“非静音区间”近似看作 speech activity。
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        temp_dir: str = "temp_audio",
        silence_noise_threshold_db: int = -35,
        silence_min_duration: float = 0.5,
        min_segment_duration: float = 0.1
    ):
        """
        Initialize detector.

        初始化检测器

        Parameters / 参数说明：
        - sample_rate:
          target sample rate / 目标采样率

        - temp_dir:
          folder to store converted WAV files / 存放转换后 WAV 文件的目录

        - silence_noise_threshold_db:
          threshold for ffmpeg silencedetect, e.g. -35 dB
          ffmpeg 静音检测阈值，例如 -35dB
          数值越高（如 -30）越容易判为静音
          数值越低（如 -45）越不容易判为静音

        - silence_min_duration:
          minimum silence length in seconds
          判定为静音所需的最短持续时间（秒）

        - min_segment_duration:
          remove tiny segments shorter than this value
          过滤太短的片段（秒）
        """
        self.sample_rate = sample_rate
        self.temp_dir = temp_dir
        self.silence_noise_threshold_db = silence_noise_threshold_db
        self.silence_min_duration = silence_min_duration
        self.min_segment_duration = min_segment_duration

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
    # Interface 2: silence detection
    # 接口2：静音检测
    # ---------------------------------------------------------
    def detect_silence_segments(self, standard_audio_path: str) -> List[AudioSegment]:
        """
        [Interface for silence detection / 静音检测接口]

        Purpose / 作用：
        Detect silence segments such as pauses, gaps,
        or parts with no meaningful audio.

        检测静音片段，例如：
        - pauses / 停顿
        - gaps / 间隙
        - no meaningful audio / 无有效声音

        Input / 输入：
        - standard_audio_path: path of standard WAV file / 标准 WAV 文件路径

        Output / 输出：
        - List[AudioSegment], label="silence"

        Used by / 调用方：
        - process()

        Internal method / 内部实现：
        - ffmpeg silencedetect filter

        Notes / 备注：
        Later this function can be replaced by another silence detector
        without changing other modules.
        后续可替换为别的方法，其他模块无需改动。
        """
        command = [
            "ffmpeg",
            "-i", standard_audio_path,
            "-af",
            f"silencedetect=noise={self.silence_noise_threshold_db}dB:d={self.silence_min_duration}",
            "-f", "null",
            "-"
        ]

        try:
            result = subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            ffmpeg_output = result.stderr
        except subprocess.CalledProcessError as e:
            # silencedetect output is usually printed in stderr
            ffmpeg_output = e.stderr
        except FileNotFoundError:
            raise RuntimeError(
                "ffmpeg is not installed or not added to PATH. "
                "Please install ffmpeg first."
            )

        silence_segments = self._parse_silencedetect_output(ffmpeg_output)
        silence_segments = self._filter_short_segments(silence_segments)
        return silence_segments

    # ---------------------------------------------------------
    # Interface 3: speech detection
    # 接口3：语音检测
    # ---------------------------------------------------------
    def detect_speech_segments(
        self,
        standard_audio_path: str,
        silence_segments: List[AudioSegment],
        audio_duration: float
    ) -> List[AudioSegment]:
        """
        [Interface for speech activity detection / 语音活动检测接口]

        Purpose / 作用：
        Detect speech activity segments.

        检测 speech activity segments（语音活动片段）

        Input / 输入：
        - standard_audio_path:
          path of standardized WAV audio
          标准化 WAV 音频路径

        - silence_segments:
          silence segments already detected
          已检测到的静音片段

        - audio_duration:
          total duration of audio
          音频总时长

        Output / 输出：
        - List[AudioSegment], label="speech"

        Used by / 调用方：
        - process()

        Important note / 重要说明：
        This version does NOT use a true speech model.
        Current logic infers speech from the complement of silence.

        当前版本不使用真实人声模型，
        而是把“静音以外的区间”近似看作 speech segments。

        Why keep this interface / 为什么保留这个接口：
        In the future, you can replace the internal logic with:
        - WebRTC VAD
        - Silero VAD
        - energy-based detector
        - other custom algorithms

        以后你们可以只替换这个函数内部实现，
        而不用改外部调用方式。
        """
        _ = standard_audio_path  # reserved for future real detector / 为后续真实检测器预留

        speech_segments = []
        current_start = 0.0

        for silence in silence_segments:
            if silence.start_time > current_start:
                speech_segments.append(
                    AudioSegment(
                        start_time=current_start,
                        end_time=silence.start_time,
                        label="speech",
                        confidence=None
                    )
                )
            current_start = silence.end_time

        if current_start < audio_duration:
            speech_segments.append(
                AudioSegment(
                    start_time=current_start,
                    end_time=audio_duration,
                    label="speech",
                    confidence=None
                )
            )

        speech_segments = self._filter_short_segments(speech_segments)
        return speech_segments

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
        3. Detect silence segments
        4. Infer speech segments
        5. Return DetectionResult

        1. 使用 ffmpeg 预处理音频
        2. 获取音频总时长
        3. 检测静音片段
        4. 反推出语音片段
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
        silence_segments = self.detect_silence_segments(standard_audio_path)
        speech_segments = self.detect_speech_segments(
            standard_audio_path=standard_audio_path,
            silence_segments=silence_segments,
            audio_duration=audio_duration
        )

        return DetectionResult(
            speech_segments=speech_segments,
            silence_segments=silence_segments,
            audio_duration=audio_duration
        )

    # =========================================================
    # Internal Helpers / 内部辅助函数
    # =========================================================

    def _parse_silencedetect_output(self, ffmpeg_output: str) -> List[AudioSegment]:
        """
        Parse ffmpeg silencedetect logs.

        解析 ffmpeg silencedetect 输出日志

        ffmpeg usually prints lines like:
        ffmpeg 通常输出类似：
        silence_start: 0
        silence_end: 1.234 | silence_duration: 1.234

        We pair silence_start and silence_end to build AudioSegment.

        通过配对 silence_start 和 silence_end 构建 AudioSegment。
        """
        silence_starts = []
        silence_ends = []

        start_pattern = re.compile(r"silence_start:\s*([0-9.]+)")
        end_pattern = re.compile(r"silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)")

        for line in ffmpeg_output.splitlines():
            start_match = start_pattern.search(line)
            if start_match:
                silence_starts.append(float(start_match.group(1)))
                continue

            end_match = end_pattern.search(line)
            if end_match:
                silence_ends.append(float(end_match.group(1)))

        silence_segments = []
        pair_count = min(len(silence_starts), len(silence_ends))

        for i in range(pair_count):
            start_time = silence_starts[i]
            end_time = silence_ends[i]

            if end_time > start_time:
                silence_segments.append(
                    AudioSegment(
                        start_time=start_time,
                        end_time=end_time,
                        label="silence",
                        confidence=None
                    )
                )

        return silence_segments

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
        silence_noise_threshold_db=-35,   # try -30 / -35 / -40 based on audio
        silence_min_duration=0.5,         # minimum silence length in seconds
        min_segment_duration=0.1
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
