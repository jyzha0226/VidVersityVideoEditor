# Faster-Whisper Setup

## 1. Create a Python environment

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-faster-whisper.txt
```

## 2. Start the subtitle API

```powershell
npm run subtitles:server
```

The API listens on `http://localhost:8787`.

## 3. Start the editor

```powershell
npm run dev
```

## Optional environment variables

```powershell
$env:FASTER_WHISPER_DEVICE="cpu"
$env:FASTER_WHISPER_COMPUTE_TYPE="int8"
$env:FASTER_WHISPER_PYTHON="E:\path\to\python.exe"
```

Use `cuda` and a GPU-friendly compute type only if your machine supports it.
