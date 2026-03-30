import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const HOST = process.env.SUBTITLE_API_HOST || '127.0.0.1'
const PORT = Number(process.env.SUBTITLE_API_PORT || 8787)
const LOCAL_PYTHON_BIN = fileURLToPath(
  new URL('../.venv/Scripts/python.exe', import.meta.url),
)
const PYTHON_BIN =
  process.env.FASTER_WHISPER_PYTHON ||
  (existsSync(LOCAL_PYTHON_BIN) ? LOCAL_PYTHON_BIN : 'python')
const WORKER_PATH = fileURLToPath(
  new URL('./faster_whisper_transcribe.py', import.meta.url),
)
const TEMP_DIR = join(tmpdir(), 'vidversity-faster-whisper')
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024

function padTime(value) {
  return value.toString().padStart(2, '0')
}

function formatSecondsAsTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    return `${padTime(hours)}:${padTime(minutes)}:${padTime(remainingSeconds)}`
  }

  return `${padTime(minutes)}:${padTime(remainingSeconds)}`
}

function formatTimeRange(startSeconds, endSeconds) {
  return `${formatSecondsAsTime(startSeconds)} - ${formatSecondsAsTime(endSeconds)}`
}

function buildDemoSuggestion({
  id,
  label,
  description,
  kind,
  startSeconds,
  endSeconds,
}) {
  return {
    id,
    label,
    timeRange: formatTimeRange(startSeconds, endSeconds),
    description,
    kind,
  }
}

function buildSceneChangeSuggestions(duration) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 120
  const firstStart = Math.min(12, Math.max(0, safeDuration * 0.1))
  const secondStart = Math.min(safeDuration - 8, Math.max(24, safeDuration * 0.45))

  return [
    buildDemoSuggestion({
      id: 'scene-1',
      label: 'Scene change',
      description: 'Scene change detected between introduction and the next visual section.',
      kind: 'scene',
      startSeconds: firstStart,
      endSeconds: Math.min(safeDuration, firstStart + 6),
    }),
    buildDemoSuggestion({
      id: 'scene-2',
      label: 'Scene change',
      description: 'Another noticeable visual transition that could be a clean cut point.',
      kind: 'scene',
      startSeconds: Math.max(0, secondStart),
      endSeconds: Math.min(safeDuration, Math.max(0, secondStart) + 5),
    }),
  ]
}

function buildSilenceSuggestions(duration) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 120
  const start = Math.min(safeDuration - 6, Math.max(8, safeDuration * 0.33))

  return [
    buildDemoSuggestion({
      id: 'silence-1',
      label: 'Silence segment',
      description: 'Long silence detected with little to no spoken content.',
      kind: 'silence',
      startSeconds: Math.max(0, start),
      endSeconds: Math.min(safeDuration, Math.max(0, start) + 7),
    }),
  ]
}

function buildTranscriptSuggestions(duration) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 120
  const start = Math.min(safeDuration - 10, Math.max(20, safeDuration * 0.7))

  return [
    buildDemoSuggestion({
      id: 'transcript-1',
      label: 'Transcript-based',
      description: 'Repeated transcript content detected that may be shortened.',
      kind: 'transcript',
      startSeconds: Math.max(0, start),
      endSeconds: Math.min(safeDuration, Math.max(0, start) + 12),
    }),
  ]
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Name',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function sanitizeFileExtension(fileName) {
  const extension = extname(fileName || '').toLowerCase()
  if (/^\.[a-z0-9]{1,8}$/.test(extension)) {
    return extension
  }
  return '.bin'
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_UPLOAD_BYTES) {
        reject(new Error('Uploaded file is too large for the local subtitle API.'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })

    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}

function runFasterWhisper(tempFilePath, { model, language }) {
  return new Promise((resolve, reject) => {
    const args = [WORKER_PATH, '--input', tempFilePath, '--model', model]

    if (language) {
      args.push('--language', language)
    }

    const child = spawn(PYTHON_BIN, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `faster-whisper worker exited with code ${code ?? 'unknown'}.`,
          ),
        )
        return
      }

      try {
        resolve(JSON.parse(stdout))
      } catch (error) {
        reject(
          new Error(
            `Could not parse subtitle worker output: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          ),
        )
      }
    })
  })
}

await mkdir(TEMP_DIR, { recursive: true })

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: 'Missing request URL.' })
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      python: PYTHON_BIN,
      worker: WORKER_PATH,
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/') {
    sendJson(response, 200, {
      ok: true,
      message: 'VidVersity subtitle API is running.',
      health: '/api/health',
      generate: '/api/subtitles/generate',
      python: PYTHON_BIN,
      sceneChanges: '/api/ai/scene-changes',
      silenceSegments: '/api/ai/silence-segments',
      transcriptSuggestions: '/api/ai/transcript-suggestions',
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/ai/scene-changes') {
    const duration = Number(url.searchParams.get('duration') || 0)
    sendJson(response, 200, {
      suggestions: buildSceneChangeSuggestions(duration),
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/ai/silence-segments') {
    const duration = Number(url.searchParams.get('duration') || 0)
    sendJson(response, 200, {
      suggestions: buildSilenceSuggestions(duration),
    })
    return
  }

  if (
    request.method === 'GET' &&
    url.pathname === '/api/ai/transcript-suggestions'
  ) {
    const duration = Number(url.searchParams.get('duration') || 0)
    sendJson(response, 200, {
      suggestions: buildTranscriptSuggestions(duration),
    })
    return
  }

  if (request.method !== 'POST' || url.pathname !== '/api/subtitles/generate') {
    sendJson(response, 404, { error: 'Route not found.' })
    return
  }

  const model = (url.searchParams.get('model') || 'base').trim()
  const language = (url.searchParams.get('language') || '').trim()
  const rawFileName = request.headers['x-file-name']
  const fileName =
    typeof rawFileName === 'string' && rawFileName.length > 0
      ? decodeURIComponent(rawFileName)
      : 'upload.bin'
  const tempFilePath = join(
    TEMP_DIR,
    `${randomUUID()}${sanitizeFileExtension(fileName)}`,
  )

  try {
    const body = await readRequestBody(request)
    if (body.length === 0) {
      sendJson(response, 400, { error: 'No video bytes were uploaded.' })
      return
    }

    await writeFile(tempFilePath, body)
    const result = await runFasterWhisper(tempFilePath, { model, language })
    sendJson(response, 200, result)
  } catch (error) {
    sendJson(response, 500, {
      error:
        error instanceof Error
          ? error.message
          : 'Subtitle generation failed unexpectedly.',
    })
  } finally {
    await rm(tempFilePath, { force: true }).catch(() => undefined)
  }
})

server.listen(PORT, HOST, () => {
  console.log(`VidVersity subtitle API running at http://${HOST}:${PORT}`)
  console.log(`Using Python: ${PYTHON_BIN}`)
})
