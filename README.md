# VidVersity Video Editor

## Overview

VidVersity is a browser-based video editing workspace with a custom editor UI, local subtitle generation, silence detection, backend-backed split editing, and export support for the edited timeline.

The current app is designed around a local development workflow:

- a frontend dev server for the editor UI
- a local Node subtitle/editor API
- Python workers for Faster-Whisper transcription and audio activity detection
- FFmpeg/ffprobe for media inspection, timeline rendering, and exports

## Current Features

### Editor Workspace

- Three-panel editor layout:
  - left navigation
  - center preview and timeline workspace
  - right workspace panel for AI, subtitles, silence review, and scene review
- Guided tooltips for toolbar actions
- Light and dark themes
- Unsaved-changes warning when leaving or refreshing the editor

### Timeline and Editing

- Upload a video directly in the editor
- Open a draft video from the Drafts page and continue editing
- Backend-backed split editing
- Delete clips from the edited timeline
- Append additional videos to the end of the current timeline with `Add Video`
- Edited timeline ruler shows cut duration
- Clip cards show source in/out ranges
- Undo support for timeline and subtitle edits

### Subtitles

- Generate subtitles from the uploaded video using Faster-Whisper
- Import subtitle files
- Edit subtitle timing and text in the right panel
- Export subtitles as SRT or VTT
- Export edited video plus a remapped SRT that matches the edited timeline

### Silence Review

- Detect silence ranges from the current video
- Review silence ranges in the right panel
- Select and stage silence ranges for future backend removal work

### Scene Review

- Scene review UI scaffold in the right panel
- Prepared for future backend scene detection and split actions

### Export

- Export the current edited timeline as a rendered MP4
- If subtitles exist, export also downloads a remapped SRT alongside the video

## Current Limits

- Trim, merge, and scene detection are still partial or UI-first flows
- Silence removal is currently review/staging only, not destructive editing
- Burned-in subtitle rendering is not enabled in the current fallback export path
- Draft/archive persistence is still app-shell level, not a full saved-project system

## Requirements

Before running the app locally, make sure you have:

- Node.js installed
- npm installed
- Python available
- the project virtual environment set up at `.venv`
- FFmpeg installed
- FFprobe available

The backend will use these in this order:

- `FASTER_WHISPER_PYTHON` if you set it
- the project virtual environment
  - Windows: `.venv\Scripts\python.exe`
  - macOS/Linux: `.venv/bin/python`
- a system Python fallback
  - Windows: `python`
  - macOS/Linux: `python3`

For FFmpeg, the backend will use:

- `VIDVERSITY_FFMPEG_BIN` if you set it
- `VIDVERSITY_FFPROBE_BIN` if you set it
- Homebrew defaults on macOS when available
- otherwise `ffmpeg` and `ffprobe` from PATH

On this machine, the backend is already wired to prefer:

```bash
/opt/homebrew/bin/ffmpeg
/opt/homebrew/bin/ffprobe
```

## Install Dependencies

Frontend:

```bash
npm install
```

Python environment and dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-faster-whisper.txt
```

If your environment is already set up, you do not need to recreate it every time.

### Windows setup

On Windows PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-faster-whisper.txt
npm install
```

If FFmpeg is not on PATH, set the paths before starting the backend:

```powershell
$env:FASTER_WHISPER_PYTHON="$PWD\.venv\Scripts\python.exe"
$env:VIDVERSITY_FFMPEG_BIN="C:\ffmpeg\bin\ffmpeg.exe"
$env:VIDVERSITY_FFPROBE_BIN="C:\ffmpeg\bin\ffprobe.exe"
```

You can use [`.env.example`](/Users/nigelrodrigo/Desktop/VidVersity/.env.example) as a reference for the supported variables.

## Start the Full App

You need both services running:

1. the frontend dev server
2. the subtitle/editor backend

### 1. Start the frontend

```bash
npm run dev
```

This starts the editor UI. In recent runs it has served locally on:

```bash
http://127.0.0.1:8001
```

The exact port can vary, so use the URL printed in the terminal.

### 2. Start the subtitle/editor backend

In a second terminal:

```bash
npm run subtitles:server
```

This starts the local API on:

```bash
http://127.0.0.1:8787
```

### 3. Open the app

Open the frontend URL from step 1 in your browser.

Example:

```bash
open -a "Google Chrome" http://127.0.0.1:8001
```

## Quick Health Checks

Check the backend:

```bash
curl -s http://127.0.0.1:8787/api/health
```

You should get a JSON response showing:

- `ok: true`
- the Python worker path
- the audio activity worker path

## Main Local Workflow

### Edit a video

1. Start the frontend and backend
2. Upload a video in the editor, or open one from Drafts
3. Use `Split` to create real editor session clips
4. Use `Delete` to remove clips from the cut
5. Use `Add Video` to append another video to the end of the timeline
6. Export the edited result

### Generate subtitles

1. Open the `Subtitles` panel
2. Click `Generate`
3. Review and edit subtitle timing/text
4. Export video and matching SRT if needed

### Review silence

1. Click `Silencer`
2. Review the detected silence ranges in the right panel
3. Select ranges you want to stage
4. Apply them as staged analysis only

## Important Commands

Start frontend:

```bash
npm run dev
```

Start backend:

```bash
npm run subtitles:server
```

Build production bundle:

```bash
npm run build
```

Backend syntax check:

```bash
node --check scripts/subtitle-server.mjs
```

## Project Notes

### Editor model

The editor now uses a backend session model for split editing and export. The UI timeline is not just a visual mock anymore for those flows.

### Source vs edited time

- clip cards show source ranges
- the bottom ruler shows edited playback time

### Multi-video append

`Add Video` appends a newly uploaded video to the end of the current timeline and rebuilds the working editor source. Because this changes the underlying media timeline, subtitle and silence analysis should be regenerated afterward if you want them to include the new content.

### Windows note

If another developer is running this on Windows, do the local compatibility pass first before Docker:

- make sure the Python virtual environment exists
- make sure FFmpeg and FFprobe are installed
- set `FASTER_WHISPER_PYTHON`, `VIDVERSITY_FFMPEG_BIN`, and `VIDVERSITY_FFPROBE_BIN` if they are not discoverable automatically

Docker may still be useful later, but the current stack should be able to run on Windows without fully containerizing the app.

### Python: `FFmpegAudioActivityDetector.py`

**FFmpeg** 将输入统一为单声道 WAV（默认 16 kHz）；**Silero VAD**（`torch.hub.load("snakers4/silero-vad", ...)`）在标准化音频上检测 **`speech`** 段；**`silence`** 为 `[0, 总时长]` 上相对语音段的间隙（补集），不再使用 FFmpeg `silencedetect`。对外推荐 **`process(audio_path)`**。

English: **FFmpeg** normalizes audio; **Silero VAD** finds speech segments; **`silence`** is the complement over the full duration. Types: `AudioSegment`, `DetectionResult`; entry: `FFmpegAudioActivityDetector.process(audio_path)`.

- **Dependencies**: FFmpeg/ffprobe on `PATH`; Python 3.8+; `pip install -r requirements.txt` (**torch**, **torchaudio** for hub loading).
- **First run / network**: `torch.hub.load` may download `snakers4/silero-vad` into the PyTorch Hub cache (e.g. `%USERPROFILE%\.cache\torch\hub\` on Windows). Later runs usually use the cache. Air-gapped setups need a local cache or JIT weights instead of first-time download.
- **Limitations**: VAD can still mis-trigger on music, speech-like noise, or singing; tune `vad_threshold`, `min_speech_duration_ms`, etc.

Quick try:

```bash
pip install -r requirements.txt
python FFmpegAudioActivityDetector.py
```

## Next Likely Backend Work

- real trim operations on the backend session model
- real merge operations on the backend session model
- scene detection backend integration
- destructive silence removal editing
- draft/project persistence across sessions


## AI Integration (Local Ollama, review-first)

- Start the local API server: `npm run subtitles:server`.
- Ensure Ollama is running locally at `http://localhost:11434`.
- Required model: `vidversity-edit` (configurable with `OLLAMA_MODEL`).
- Optional environment variables:
  - `OLLAMA_BASE_URL` (default `http://localhost:11434`)
  - `OLLAMA_MODEL` (default `vidversity-edit`)
  - `OLLAMA_TIMEOUT_MS` (default `12000`)
- Frontend sends AI requests to backend endpoints (`/api/ai/edit-command`, `/api/ai/chapter-suggestions`), and backend proxies to Ollama.
- AI responses are validated/normalized and always returned as review-only suggestions (`needs_review: true`).
- Suggestions must be confirmed in the UI before any edit adapter is invoked.
- Run example prompt checks: `node scripts/ai-integration-examples.mjs`.
- Recommended `vidversity-edit` System Prompt guidance:
  - Return JSON only (no markdown/code fences).
  - Keep chapter suggestions time-contiguous and ordered by timeline position.
  - Use `null` timestamps when missing and add clarification notes.
  - Keep `needs_review: true` for all responses.
