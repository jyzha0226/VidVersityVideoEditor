# Quick Start (PowerShell)

## 1) First-time setup (run once)

```powershell
npm install
python -m pip install -r requirements-faster-whisper.txt
```

## 2) Start frontend (Terminal A)

```powershell
npm run dev
```

Open: `http://127.0.0.1:8000`

## 3) Start AI/subtitle server (Terminal B)

Use latest tunnel URL:

```powershell
$env:OLLAMA_BASE_URL="https://alerts-barrel-messaging-what.trycloudflare.com"; npm run subtitles:server
```

## 4) Quick health check

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8787/
```

If healthy, response includes fields like:
- `aiEditCommand`
- `aiChapterSuggestions`

## 5) Restart subtitle server quickly

```powershell
$p=(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess); if($p){Stop-Process -Id $p -Force}
$env:OLLAMA_BASE_URL="https://alerts-barrel-messaging-what.trycloudflare.com"; npm run subtitles:server
```

## 6) Common issue

If you see:

`Python package 'faster-whisper' is not installed`

run:

```powershell
python -m pip install -r requirements-faster-whisper.txt
```

