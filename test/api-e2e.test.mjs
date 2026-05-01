import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const HOST = '127.0.0.1'
const PORT = Number(process.env.TEST_SUBTITLE_API_PORT || 8791)
const BASE_URL = `http://${HOST}:${PORT}`
const RUN_AI_TESTS = process.env.RUN_AI_TESTS === '1'
const FFMPEG_BIN = process.env.VIDVERSITY_FFMPEG_BIN || '/opt/homebrew/bin/ffmpeg'
const serverPath = fileURLToPath(new URL('../scripts/subtitle-server.mjs', import.meta.url))

let serverProcess = null
let fixtureDir = ''
let videoPath = ''
let textPath = ''
let sessionId = ''

async function waitForHealth(timeoutMs = 20000) {
  const start = Date.now()
  let lastError = null

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`)
      if (response.ok) {
        return
      }
      lastError = new Error(`Health endpoint returned ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(
    `Subtitle API did not become healthy in time: ${
      lastError instanceof Error ? lastError.message : 'unknown error'
    }`,
  )
}

async function spawnFixtureVideo(outputPath) {
  await new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=640x360:rate=24:duration=3',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1000:sample_rate=44100:duration=3',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-shortest',
      outputPath,
    ]
    const ffmpeg = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''

    ffmpeg.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    ffmpeg.on('error', reject)
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`ffmpeg failed (${code ?? 'unknown'}): ${stderr.trim()}`))
    })
  })
}

async function postJson(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  return { response, data }
}

async function postBinary(path, filePath, fileName) {
  const bytes = await readFile(filePath)
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(fileName),
    },
    body: bytes,
  })

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return { response, data: await response.json(), bytes: null }
  }
  return { response, data: null, bytes: Buffer.from(await response.arrayBuffer()) }
}

test.before(async () => {
  fixtureDir = await mkdtemp(join(tmpdir(), 'vidversity-api-test-'))
  videoPath = join(fixtureDir, 'fixture.mp4')
  textPath = join(fixtureDir, 'not-a-video.txt')

  await spawnFixtureVideo(videoPath)
  await writeFile(textPath, 'not a video file', 'utf8')

  serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      SUBTITLE_API_HOST: HOST,
      SUBTITLE_API_PORT: String(PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let startupLogs = ''
  serverProcess.stdout.on('data', (chunk) => {
    startupLogs += chunk.toString()
  })
  serverProcess.stderr.on('data', (chunk) => {
    startupLogs += chunk.toString()
  })
  serverProcess.on('exit', (code, signal) => {
    if (signal === 'SIGTERM') {
      return
    }
    if (code !== 0) {
      process.stderr.write(`subtitle-server exited early (${code ?? 'unknown'}):\n${startupLogs}\n`)
    }
  })

  await waitForHealth()
})

test.after(async () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM')
  }
  if (fixtureDir) {
    await rm(fixtureDir, { recursive: true, force: true })
  }
})

test('health endpoint returns expected shape', async () => {
  const response = await fetch(`${BASE_URL}/api/health`)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.ok, true)
  assert.equal(typeof payload.python, 'string')
})

test('create editor session by uploading a valid video', async () => {
  const { response, data } = await postBinary('/api/editor/session', videoPath, 'fixture.mp4')
  assert.equal(response.status, 200)
  assert.equal(typeof data.sessionId, 'string')
  assert.equal(data.segments.length, 1)
  assert.ok(data.duration > 0)
  sessionId = data.sessionId
})

test('split, cut, and export edited timeline', async () => {
  assert.ok(sessionId, 'sessionId should be set from upload test')

  const splitResult = await postJson('/api/editor/split', {
    sessionId,
    segmentId: 1,
    splitTime: 1.2,
  })
  assert.equal(splitResult.response.status, 200)
  assert.equal(splitResult.data.segments.length, 2)

  const cutResult = await postJson('/api/editor/cut', {
    sessionId,
    cutStart: 0.2,
    cutEnd: 2.0,
  })
  assert.equal(cutResult.response.status, 200)
  assert.ok(cutResult.data.segments.length >= 1)

  const exportResponse = await fetch(`${BASE_URL}/api/editor/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })

  assert.equal(exportResponse.status, 200)
  assert.equal(exportResponse.headers.get('content-type'), 'video/mp4')
  const bytes = Buffer.from(await exportResponse.arrayBuffer())
  assert.ok(bytes.length > 1000, 'exported video should not be empty')
})

test('reject unsupported file input for editor session', async () => {
  const { response, data } = await postBinary('/api/editor/session', textPath, 'bad.txt')
  assert.equal(response.status, 500)
  assert.equal(typeof data.error, 'string')
})

test('invalid JSON body returns error on editor session replace', async () => {
  const response = await fetch(`${BASE_URL}/api/editor/session/replace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json}',
  })
  const payload = await response.json()

  assert.equal(response.status, 500)
  assert.match(payload.error, /valid JSON/i)
})

test('optional AI: subtitle generation endpoint responds', { skip: !RUN_AI_TESTS }, async () => {
  const { response, data } = await postBinary(
    '/api/subtitles/generate?model=tiny&language=en',
    videoPath,
    'fixture.mp4',
  )

  assert.equal(response.status, 200)
  assert.ok(Array.isArray(data.segments), 'subtitle result should include segments array')
})

test('optional AI: silence detection endpoint responds', { skip: !RUN_AI_TESTS }, async () => {
  const { response, data } = await postBinary(
    '/api/audio/detect-silence?noiseThresholdDb=-35&minSilenceDuration=0.2&minSegmentDuration=0.1',
    videoPath,
    'fixture.mp4',
  )

  assert.equal(response.status, 200)
  assert.ok(
    Array.isArray(data.silence_segments) || Array.isArray(data.speech_segments),
    'audio activity response should include silence or speech segments',
  )
})
