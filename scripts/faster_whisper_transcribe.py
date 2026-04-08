import argparse
import json
import os
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate subtitle segments from a video file with faster-whisper."
    )
    parser.add_argument("--input", required=True, help="Path to the source video or audio file.")
    parser.add_argument("--model", default="base", help="Faster-Whisper model name.")
    parser.add_argument(
        "--language",
        default=None,
        help='Optional language hint such as "en". Omit or pass "auto" for detection.',
    )
    parser.add_argument(
        "--device",
        default=os.environ.get("FASTER_WHISPER_DEVICE", "cpu"),
        help='Inference device, usually "cpu" or "cuda".',
    )
    parser.add_argument(
        "--compute-type",
        dest="compute_type",
        default=os.environ.get("FASTER_WHISPER_COMPUTE_TYPE", "int8"),
        help='CTranslate2 compute type such as "int8", "float16", or "float32".',
    )
    parser.add_argument(
        "--vad-filter",
        dest="vad_filter",
        action="store_true",
        help="Enable Faster-Whisper voice activity detection filtering.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(
            "Python package 'faster-whisper' is not installed. "
            "Run: pip install -r requirements-faster-whisper.txt",
            file=sys.stderr,
        )
        return 2

    language = None if not args.language or args.language == "auto" else args.language

    try:
        model = WhisperModel(
            args.model,
            device=args.device,
            compute_type=args.compute_type,
        )
        segments, info = model.transcribe(
            args.input,
            language=language,
            beam_size=5,
            vad_filter=args.vad_filter,
        )

        payload = {
            "language": getattr(info, "language", None),
            "duration": getattr(info, "duration", None),
            "segments": [],
        }

        for index, segment in enumerate(segments):
            payload["segments"].append(
                {
                    "id": f"seg-{index}",
                    "start": float(segment.start),
                    "end": float(segment.end),
                    "text": (segment.text or "").strip(),
                }
            )

        print(json.dumps(payload, ensure_ascii=True))
        return 0
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
