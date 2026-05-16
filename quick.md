# Quick Start (PowerShell)

This file mirrors `README.md` and gives copy/paste commands.

## 0) Project root

```powershell
Set-Location "E:\swinburne\2026_s1\COS80029\VidVersity7\VidVersityVideoEditor"
```

## 1) First-time setup (run once)

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-faster-whisper.txt
npm install
```

## 2) Start whole project (copy/paste block)

### Option A: Quick Tunnel (team testing)

Replace the URL with the latest maintainer tunnel URL.

```powershell
$root = "E:\swinburne\2026_s1\COS80029\VidVersity7\VidVersityVideoEditor"
$tunnel = "https://xxxx-xxxx-xxxx.trycloudflare.com"

Set-Location $root

Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root'; `$env:OLLAMA_BASE_URL='$tunnel'; npm run subtitles:server"
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root'; npm run dev"
```

### Option B: Local Modelfile deployment (independent testing)

```powershell
$root = "E:\swinburne\2026_s1\COS80029\VidVersity7\VidVersityVideoEditor"
Set-Location $root

ollama pull qwen2.5:7b-instruct
ollama create vidversity-edit-parser -f Modelfile
ollama list

Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root'; `$env:OLLAMA_BASE_URL='http://127.0.0.1:11434'; `$env:OLLAMA_MODEL='vidversity-edit-parser'; npm run subtitles:server"
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root'; npm run dev"
```

Open frontend URL printed by dev server (usually `http://127.0.0.1:8000` or `8001`).

## 3) Health checks

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8787/api/health
```

For Ollama (local mode):

```powershell
curl.exe -s http://127.0.0.1:11434/api/tags
```

## 4) Restart backend quickly

```powershell
$p=(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
if($p){Stop-Process -Id $p -Force}

# Quick Tunnel mode:
# $env:OLLAMA_BASE_URL="https://xxxx-xxxx-xxxx.trycloudflare.com"
# Remove/leave OLLAMA_MODEL default unless needed

# Local Modelfile mode:
# $env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
# $env:OLLAMA_MODEL="vidversity-edit-parser"

npm run subtitles:server
```

## 5) Troubleshooting

- `Python package 'faster-whisper' is not installed`
  ```powershell
  pip install -r requirements-faster-whisper.txt
  ```
- `ollama` not found:
  - install Ollama
  - restart terminal
- Quick Tunnel URL invalid:
  - ask maintainer for a newly generated `trycloudflare.com` URL

