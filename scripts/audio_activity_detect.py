import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from typing import List, Optional

DEFAULT_FFMPEG_BIN = (
    os.environ.get("VIDVERSITY_FFMPEG_BIN")
    or ("/opt/homebrew/bin/ffmpeg" if os.path.exists("/opt/homebrew/bin/ffmpeg") else "ffmpeg")
)
DEFAULT_FFPROBE_BIN = (
    os.environ.get("VIDVERSITY_FFPROBE_BIN")
    or ("/opt/homebrew/bin/ffprobe" if os.path.exists("/opt/homebrew/bin/ffprobe") else "ffprobe")
)


@dataclass
class AudioSegment:
    start_time: float
    end_time: float
    label: str
    confidence: Optional[float] = None


@dataclass
class DetectionResult:
    speech_segments: List[AudioSegment]
    silence_segments: List[AudioSegment]
    audio_duration: float


class FFmpegAudioActivityDetector:
    def __init__(
        self,
        sample_rate: int = 16000,
        temp_dir: str = "temp_audio",
        silence_noise_threshold_db: int = -35,
        silence_min_duration: float = 0.5,
        min_segment_duration: float = 0.1,
    ) -> None:
        self.sample_rate = sample_rate
        self.temp_dir = temp_dir
        self.silence_noise_threshold_db = silence_noise_threshold_db
        self.silence_min_duration = silence_min_duration
        self.min_segment_duration = min_segment_duration
        self.ffmpeg_bin = DEFAULT_FFMPEG_BIN
        self.ffprobe_bin = DEFAULT_FFPROBE_BIN

        os.makedirs(self.temp_dir, exist_ok=True)

    def load_audio(self, audio_path: str) -> str:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        output_path = os.path.join(self.temp_dir, f"{base_name}_standard.wav")

        command = [
            self.ffmpeg_bin,
            "-y",
            "-i",
            audio_path,
            "-ac",
            "1",
            "-ar",
            str(self.sample_rate),
            "-vn",
            output_path,
        ]

        try:
            subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(
                f"ffmpeg is not installed or not available at {self.ffmpeg_bin}."
            ) from exc
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"ffmpeg audio conversion failed:\n{exc.stderr}") from exc

        return output_path

    def get_audio_duration(self, audio_path: str) -> float:
        command = [
            self.ffprobe_bin,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            audio_path,
        ]

        try:
            result = subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            return float(result.stdout.strip())
        except FileNotFoundError as exc:
            raise RuntimeError(
                f"ffprobe is not installed or not available at {self.ffprobe_bin}."
            ) from exc
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"ffprobe failed:\n{exc.stderr}") from exc
        except ValueError as exc:
            raise RuntimeError("Unable to parse audio duration from ffprobe output.") from exc

    def detect_silence_segments(
        self, standard_audio_path: str, audio_duration: float
    ) -> List[AudioSegment]:
        command = [
            self.ffmpeg_bin,
            "-i",
            standard_audio_path,
            "-af",
            (
                "silencedetect="
                f"noise={self.silence_noise_threshold_db}dB:"
                f"d={self.silence_min_duration}"
            ),
            "-f",
            "null",
            "-",
        ]

        try:
            result = subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            ffmpeg_output = result.stderr
        except subprocess.CalledProcessError as exc:
            ffmpeg_output = exc.stderr
        except FileNotFoundError as exc:
            raise RuntimeError(
                f"ffmpeg is not installed or not available at {self.ffmpeg_bin}."
            ) from exc

        silence_segments = self._parse_silencedetect_output(ffmpeg_output, audio_duration)
        return self._filter_short_segments(silence_segments)

    def detect_speech_segments(
        self, silence_segments: List[AudioSegment], audio_duration: float
    ) -> List[AudioSegment]:
        speech_segments: List[AudioSegment] = []
        current_start = 0.0

        for silence in silence_segments:
            if silence.start_time > current_start:
                speech_segments.append(
                    AudioSegment(
                        start_time=current_start,
                        end_time=silence.start_time,
                        label="speech",
                    )
                )
            current_start = silence.end_time

        if current_start < audio_duration:
            speech_segments.append(
                AudioSegment(
                    start_time=current_start,
                    end_time=audio_duration,
                    label="speech",
                )
            )

        return self._filter_short_segments(speech_segments)

    def process(self, audio_path: str) -> DetectionResult:
        standard_audio_path = self.load_audio(audio_path)
        audio_duration = self.get_audio_duration(standard_audio_path)
        silence_segments = self.detect_silence_segments(standard_audio_path, audio_duration)
        speech_segments = self.detect_speech_segments(silence_segments, audio_duration)
        return DetectionResult(
            speech_segments=speech_segments,
            silence_segments=silence_segments,
            audio_duration=audio_duration,
        )

    def _parse_silencedetect_output(
        self, ffmpeg_output: str, audio_duration: float
    ) -> List[AudioSegment]:
        silence_starts: List[float] = []
        silence_ends: List[float] = []

        start_pattern = re.compile(r"silence_start:\s*([0-9.]+)")
        end_pattern = re.compile(
            r"silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)"
        )

        for line in ffmpeg_output.splitlines():
            start_match = start_pattern.search(line)
            if start_match:
                silence_starts.append(float(start_match.group(1)))
                continue

            end_match = end_pattern.search(line)
            if end_match:
                silence_ends.append(float(end_match.group(1)))

        if len(silence_starts) > len(silence_ends):
            trailing_start = silence_starts[len(silence_ends)]
            if audio_duration > trailing_start:
                silence_ends.append(audio_duration)

        silence_segments: List[AudioSegment] = []
        for index in range(min(len(silence_starts), len(silence_ends))):
            start_time = silence_starts[index]
            end_time = silence_ends[index]

            if end_time > start_time:
                silence_segments.append(
                    AudioSegment(
                        start_time=start_time,
                        end_time=end_time,
                        label="silence",
                    )
                )

        return silence_segments

    def _filter_short_segments(self, segments: List[AudioSegment]) -> List[AudioSegment]:
        return [
            segment
            for segment in segments
            if (segment.end_time - segment.start_time) >= self.min_segment_duration
        ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Detect silence and speech-like activity from a media file."
    )
    parser.add_argument("--input", required=True, help="Path to the source video or audio file.")
    parser.add_argument("--sample-rate", type=int, default=16000)
    parser.add_argument("--temp-dir", default="temp_audio")
    parser.add_argument("--noise-threshold-db", type=int, default=-35)
    parser.add_argument("--min-silence-duration", type=float, default=0.5)
    parser.add_argument("--min-segment-duration", type=float, default=0.1)
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        detector = FFmpegAudioActivityDetector(
            sample_rate=args.sample_rate,
            temp_dir=args.temp_dir,
            silence_noise_threshold_db=args.noise_threshold_db,
            silence_min_duration=args.min_silence_duration,
            min_segment_duration=args.min_segment_duration,
        )
        result = detector.process(args.input)
        payload = {
            "audioDuration": result.audio_duration,
            "speechSegments": [asdict(segment) for segment in result.speech_segments],
            "silenceSegments": [asdict(segment) for segment in result.silence_segments],
        }
        print(json.dumps(payload, ensure_ascii=True))
        return 0
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
