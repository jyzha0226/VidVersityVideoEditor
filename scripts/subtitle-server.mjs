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
const LOCAL_WINDOWS_PYTHON_BIN = fileURLToPath(
  new URL('../.venv/Scripts/python.exe', import.meta.url),
)
const LOCAL_UNIX_PYTHON_BIN = fileURLToPath(
  new URL('../.venv/bin/python', import.meta.url),
)
const PYTHON_BIN =
  process.env.FASTER_WHISPER_PYTHON ||
  (existsSync(LOCAL_UNIX_PYTHON_BIN)
    ? LOCAL_UNIX_PYTHON_BIN
    : existsSync(LOCAL_WINDOWS_PYTHON_BIN)
      ? LOCAL_WINDOWS_PYTHON_BIN
      : 'python3')
const WORKER_PATH = fileURLToPath(
  new URL('./faster_whisper_transcribe.py', import.meta.url),
)
const AUDIO_ACTIVITY_WORKER_PATH = fileURLToPath(
  new URL('./audio_activity_detect.py', import.meta.url),
)
const TEMP_DIR = join(tmpdir(), 'vidversity-faster-whisper')
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024

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

function runPythonWorker(workerPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [workerPath, ...args], {
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
              `${workerPath} exited with code ${code ?? 'unknown'}.`,
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

function runFasterWhisper(tempFilePath, { model, language }) {
  const args = ['--input', tempFilePath, '--model', model]

  if (language) {
    args.push('--language', language)
  }

  return runPythonWorker(WORKER_PATH, args)
}

function runAudioActivityDetection(
  tempFilePath,
  { noiseThresholdDb, minSilenceDuration, minSegmentDuration },
) {
  const args = ['--input', tempFilePath]

  if (Number.isFinite(noiseThresholdDb)) {
    args.push('--noise-threshold-db', `${Math.round(noiseThresholdDb)}`)
  }
  if (Number.isFinite(minSilenceDuration)) {
    args.push('--min-silence-duration', `${minSilenceDuration}`)
  }
  if (Number.isFinite(minSegmentDuration)) {
    args.push('--min-segment-duration', `${minSegmentDuration}`)
  }

  return runPythonWorker(AUDIO_ACTIVITY_WORKER_PATH, args)
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
      audioActivityWorker: AUDIO_ACTIVITY_WORKER_PATH,
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/') {
    sendJson(response, 200, {
      ok: true,
      message: 'VidVersity subtitle API is running.',
      health: '/api/health',
      generate: '/api/subtitles/generate',
      detectSilence: '/api/audio/detect-silence',
      python: PYTHON_BIN,
    })
    return
  }

  if (request.method !== 'POST') {
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
    if (url.pathname === '/api/subtitles/generate') {
      const result = await runFasterWhisper(tempFilePath, { model, language })
      sendJson(response, 200, result)
      return
    }

    if (url.pathname === '/api/audio/detect-silence') {
      const noiseThresholdDb = Number(url.searchParams.get('noiseThresholdDb') || '-35')
      const minSilenceDuration = Number(
        url.searchParams.get('minSilenceDuration') || '0.5',
      )
      const minSegmentDuration = Number(
        url.searchParams.get('minSegmentDuration') || '0.1',
      )

      const result = await runAudioActivityDetection(tempFilePath, {
        noiseThresholdDb,
        minSilenceDuration,
        minSegmentDuration,
      })
      sendJson(response, 200, result)
      return
    }

    sendJson(response, 404, { error: 'Route not found.' })
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
