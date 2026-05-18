# VidVersity Backend Container

This Docker image runs the local VidVersity backend API for subtitles, editor media operations, silence detection, export, and AI suggestions.

## Build Locally

```bash
docker build -f Dockerfile.backend -t vidversity-backend .
```

## Run Locally

```bash
docker run --rm -p 8787:8787 \
  -e OLLAMA_BASE_URL="https://alerts-barrel-messaging-what.trycloudflare.com" \
  -e OLLAMA_MODEL="vidversity-edit" \
  vidversity-backend
```

Health check:

```bash
curl -s http://127.0.0.1:8787/api/health
```

## Important Environment Variables

```text
SUBTITLE_API_HOST=0.0.0.0
SUBTITLE_API_PORT=8787
OLLAMA_BASE_URL=https://alerts-barrel-messaging-what.trycloudflare.com
OLLAMA_MODEL=vidversity-edit
OLLAMA_TIMEOUT_MS=30000
FASTER_WHISPER_DEVICE=cpu
FASTER_WHISPER_COMPUTE_TYPE=int8
```

## Cloudflare Shape

Use this image for the backend container. The public API URL should be the URL you configure in front of the container, for example:

```text
https://api.your-domain.com
```

The Cloudflare Pages frontend must set:

```html
<script>
  window.__VIDVERSITY_SUBTITLE_API__ = 'https://api.your-domain.com'
</script>
```

The backend image includes Node.js, Python, Faster-Whisper, FFmpeg, and ffprobe. First subtitle generation may take longer if Faster-Whisper needs to download a model into the container cache.
