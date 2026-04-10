import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
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
const HOMEBREW_FFMPEG_BIN = '/opt/homebrew/bin/ffmpeg'
const HOMEBREW_FFPROBE_BIN = '/opt/homebrew/bin/ffprobe'
const FFMPEG_BIN =
  process.env.VIDVERSITY_FFMPEG_BIN ||
  (existsSync(HOMEBREW_FFMPEG_BIN) ? HOMEBREW_FFMPEG_BIN : 'ffmpeg')
const FFPROBE_BIN =
  process.env.VIDVERSITY_FFPROBE_BIN ||
  (existsSync(HOMEBREW_FFPROBE_BIN) ? HOMEBREW_FFPROBE_BIN : 'ffprobe')
const TEMP_DIR = join(tmpdir(), 'vidversity-faster-whisper')
const EDITOR_SESSION_DIR = join(TEMP_DIR, 'editor-sessions')
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024
const editorSessions = new Map()

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Name',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Disposition',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function sendBinary(response, statusCode, body, contentType, fileName) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Name',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Disposition',
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${fileName}"`,
  })
  response.end(body)
}

function sanitizeFileExtension(fileName) {
  const extension = extname(fileName || '').toLowerCase()
  if (/^\.[a-z0-9]{1,8}$/.test(extension)) {
    return extension
  }
  return '.bin'
}

function sanitizeBaseName(fileName) {
  const withoutExtension = `${fileName || 'vidversity-export'}`
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')

  return withoutExtension || 'vidversity-export'
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

function parseJsonBody(buffer) {
  try {
    return JSON.parse(buffer.toString('utf8'))
  } catch {
    throw new Error('Request body must be valid JSON.')
  }
}

function sanitizeSubtitleSegments(segments) {
  if (!Array.isArray(segments)) {
    return []
  }

  return segments
    .map((segment) => {
      const start = Number(segment?.start)
      const end = Number(segment?.end)
      const text =
        typeof segment?.text === 'string' ? segment.text.trim() : ''

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null
      }

      return {
        start,
        end,
        text,
      }
    })
    .filter(Boolean)
}

function sanitizeEditorSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('Editor session requires at least one clip segment.')
  }

  return segments
    .map((segment, index) => {
      const id = Number(segment?.id)
      const start = Number(segment?.start)
      const end = Number(segment?.end)
      const label =
        typeof segment?.label === 'string' && segment.label.trim().length > 0
          ? segment.label.trim()
          : `Clip ${index + 1}`

      if (!Number.isFinite(id) || !Number.isFinite(start) || !Number.isFinite(end)) {
        throw new Error('Clip segments must include numeric id, start, and end values.')
      }

      if (end <= start) {
        throw new Error('Clip segment end time must be greater than start time.')
      }

      return { id, label, start, end }
    })
    .sort((left, right) => left.start - right.start)
}

function relabelEditorSegments(segments) {
  return segments.map((segment, index) => ({
    ...segment,
    label: `Clip ${index + 1}`,
  }))
}

function serializeEditorSession(session) {
  return {
    sessionId: session.id,
    duration: session.duration,
    selectedSegmentId: session.selectedSegmentId,
    segments: session.segments.map((segment) => ({ ...segment })),
  }
}

function buildEditorExportName(session) {
  return `${sanitizeBaseName(session.fileName || 'vidversity-export')}-edited.mp4`
}

function buildEditorSourceName(session) {
  return `${sanitizeBaseName(session.fileName || 'vidversity-source')}.mp4`
}

function formatSrtTimestamp(seconds) {
  const totalMs = Math.max(0, Math.floor(seconds * 1000))
  const hours = Math.floor(totalMs / 3_600_000)
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000)
  const secs = Math.floor((totalMs % 60_000) / 1_000)
  const ms = totalMs % 1_000
  const pad = (value, size) => `${value}`.padStart(size, '0')
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`
}

function buildSrtContent(segments) {
  return segments
    .map((segment, index) => {
      const text = segment.text?.trim() || '...'
      return `${index + 1}\n${formatSrtTimestamp(segment.start)} --> ${formatSrtTimestamp(
        segment.end,
      )}\n${text}`
    })
    .join('\n\n')
}

function remapSubtitlesForEditorTimeline(editorSegments, subtitles) {
  if (!Array.isArray(subtitles) || subtitles.length === 0) {
    return []
  }

  const remapped = []
  let outputOffset = 0

  editorSegments.forEach((editorSegment) => {
    const segmentDuration = editorSegment.end - editorSegment.start
    if (segmentDuration <= 0) {
      return
    }

    subtitles.forEach((subtitle) => {
      const overlapStart = Math.max(editorSegment.start, subtitle.start)
      const overlapEnd = Math.min(editorSegment.end, subtitle.end)

      if (overlapEnd <= overlapStart) {
        return
      }

      remapped.push({
        start: outputOffset + (overlapStart - editorSegment.start),
        end: outputOffset + (overlapEnd - editorSegment.start),
        text: subtitle.text,
      })
    })

    outputOffset += segmentDuration
  })

  return remapped.filter((segment) => segment.end - segment.start >= 0.05)
}

function escapeSubtitlesFilterPath(filePath) {
  return filePath
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
}

function getEditorSession(sessionId) {
  const session = editorSessions.get(sessionId)
  if (!session) {
    throw new Error('Editor session not found. Upload the video again to start a new session.')
  }
  return session
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

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
    child.on('error', (error) => {
      reject(error)
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `${command} exited with code ${code ?? 'unknown'}.`,
          ),
        )
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

function isMissingBinaryError(error) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT',
  )
}

async function getMediaDuration(filePath) {
  try {
    const { stdout } = await runCommand(FFPROBE_BIN, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ])
    const duration = Number(stdout.trim())
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('ffprobe did not return a valid media duration.')
    }
    return duration
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffprobe is not installed or not available at ${FFPROBE_BIN}.`)
    }
    throw error
  }
}

async function inspectMediaStreams(filePath) {
  try {
    const { stdout } = await runCommand(FFPROBE_BIN, [
      '-v',
      'error',
      '-show_entries',
      'stream=codec_type',
      '-of',
      'json',
      filePath,
    ])

    const payload = JSON.parse(stdout)
    const streams = Array.isArray(payload?.streams) ? payload.streams : []

    return {
      hasVideo: streams.some((stream) => stream?.codec_type === 'video'),
      hasAudio: streams.some((stream) => stream?.codec_type === 'audio'),
    }
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffprobe is not installed or not available at ${FFPROBE_BIN}.`)
    }
    throw error
  }
}

async function ensureSubtitleBurnSupport() {
  try {
    const { stdout } = await runCommand(FFMPEG_BIN, ['-filters'])
    if (/\bsubtitles\b/.test(stdout)) {
      return
    }
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffmpeg is not installed or not available at ${FFMPEG_BIN}.`)
    }
    throw error
  }

  throw new Error(
    'The installed FFmpeg build does not include the subtitles filter needed to burn captions into video. Install an FFmpeg build with libass/subtitles support, or export without burned subtitles.',
  )
}

async function normalizeMediaForTimeline(filePath, outputPath) {
  const { hasVideo, hasAudio } = await inspectMediaStreams(filePath)
  if (!hasVideo) {
    throw new Error('The uploaded file does not contain a video stream.')
  }

  const args = ['-y', '-i', filePath]

  if (!hasAudio) {
    args.push(
      '-f',
      'lavfi',
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-shortest',
    )
  }

  args.push(
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath,
  )

  try {
    await runCommand(FFMPEG_BIN, args)
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffmpeg is not installed or not available at ${FFMPEG_BIN}.`)
    }
    throw error
  }
}

async function appendEditorMedia(existingFilePath, appendedFilePath, outputPath) {
  const normalizedExistingPath = join(
    EDITOR_SESSION_DIR,
    `${randomUUID()}-existing-normalized.mp4`,
  )
  const normalizedAppendedPath = join(
    EDITOR_SESSION_DIR,
    `${randomUUID()}-append-normalized.mp4`,
  )

  try {
    await normalizeMediaForTimeline(existingFilePath, normalizedExistingPath)
    await normalizeMediaForTimeline(appendedFilePath, normalizedAppendedPath)
    await runCommand(FFMPEG_BIN, [
      '-y',
      '-i',
      normalizedExistingPath,
      '-i',
      normalizedAppendedPath,
      '-filter_complex',
      '[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[vout][aout]',
      '-map',
      '[vout]',
      '-map',
      '[aout]',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      outputPath,
    ])
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffmpeg is not installed or not available at ${FFMPEG_BIN}.`)
    }
    throw error
  } finally {
    await rm(normalizedExistingPath, { force: true }).catch(() => undefined)
    await rm(normalizedAppendedPath, { force: true }).catch(() => undefined)
  }
}

async function renderEditorSession(session, subtitles = []) {
  const { hasVideo, hasAudio } = await inspectMediaStreams(session.filePath)
  if (!hasVideo) {
    throw new Error('The uploaded file does not contain a video stream.')
  }

  const baseOutputPath = join(EDITOR_SESSION_DIR, `${session.id}-export-base.mp4`)
  const outputPath = join(EDITOR_SESSION_DIR, `${session.id}-export.mp4`)
  const filterParts = []
  const concatInputs = []

  session.segments.forEach((segment, index) => {
    filterParts.push(
      `[0:v]trim=start=${segment.start}:end=${segment.end},setpts=PTS-STARTPTS[v${index}]`,
    )
    concatInputs.push(`[v${index}]`)

    if (hasAudio) {
      filterParts.push(
        `[0:a]atrim=start=${segment.start}:end=${segment.end},asetpts=PTS-STARTPTS[a${index}]`,
      )
      concatInputs.push(`[a${index}]`)
    }
  })

  filterParts.push(
    `${concatInputs.join('')}concat=n=${session.segments.length}:v=1:a=${
      hasAudio ? 1 : 0
    }[vout]${hasAudio ? '[aout]' : ''}`,
  )

  const args = [
    '-y',
    '-i',
    session.filePath,
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[vout]',
  ]

  if (hasAudio) {
    args.push('-map', '[aout]')
  }

  args.push(
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-movflags',
    '+faststart',
  )

  if (hasAudio) {
    args.push('-c:a', 'aac', '-b:a', '192k')
  } else {
    args.push('-an')
  }

  args.push(baseOutputPath)

  try {
    await runCommand(FFMPEG_BIN, args)
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffmpeg is not installed or not available at ${FFMPEG_BIN}.`)
    }
    throw error
  }

  const remappedSubtitles = remapSubtitlesForEditorTimeline(
    session.segments,
    subtitles,
  )

  if (remappedSubtitles.length === 0) {
    await rm(outputPath, { force: true }).catch(() => undefined)
    await writeFile(outputPath, await readFile(baseOutputPath))
    await rm(baseOutputPath, { force: true }).catch(() => undefined)
    return outputPath
  }

  const subtitlePath = join(EDITOR_SESSION_DIR, `${session.id}-export.srt`)

  try {
    await ensureSubtitleBurnSupport()
    await writeFile(subtitlePath, buildSrtContent(remappedSubtitles), 'utf8')
    await runCommand(FFMPEG_BIN, [
      '-y',
      '-i',
      baseOutputPath,
      '-vf',
      `subtitles=filename='${escapeSubtitlesFilterPath(subtitlePath)}'`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-movflags',
      '+faststart',
      '-c:a',
      'copy',
      outputPath,
    ])
  } catch (error) {
    if (isMissingBinaryError(error)) {
      throw new Error(`ffmpeg is not installed or not available at ${FFMPEG_BIN}.`)
    }
    throw error
  } finally {
    await rm(baseOutputPath, { force: true }).catch(() => undefined)
    await rm(subtitlePath, { force: true }).catch(() => undefined)
  }

  return outputPath
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
await mkdir(EDITOR_SESSION_DIR, { recursive: true })

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
      editorSessions: editorSessions.size,
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
      createEditorSession: '/api/editor/session',
      editorSource: '/api/editor/source?sessionId=...',
      replaceEditorSession: '/api/editor/session/replace',
      appendEditorMedia: '/api/editor/append?sessionId=...',
      splitEditorSession: '/api/editor/split',
      exportEditorSession: '/api/editor/export',
      python: PYTHON_BIN,
    })
    return
  }

  if (request.method !== 'POST') {
    if (request.method === 'GET' && url.pathname === '/api/editor/source') {
      const sessionId = url.searchParams.get('sessionId') || ''
      try {
        const session = getEditorSession(sessionId)
        const data = await readFile(session.filePath)
        sendBinary(
          response,
          200,
          data,
          'video/mp4',
          buildEditorSourceName(session),
        )
      } catch (error) {
        sendJson(response, 400, {
          error:
            error instanceof Error
              ? error.message
              : 'Could not load the current editor source media.',
        })
      }
      return
    }

    sendJson(response, 404, { error: 'Route not found.' })
    return
  }

  let tempFilePath = null

  try {
    const body = await readRequestBody(request)
    if (body.length === 0) {
      sendJson(response, 400, { error: 'No video bytes were uploaded.' })
      return
    }

    if (url.pathname === '/api/editor/session') {
      const rawFileName = request.headers['x-file-name']
      const fileName =
        typeof rawFileName === 'string' && rawFileName.length > 0
          ? decodeURIComponent(rawFileName)
          : 'upload.bin'
      const sessionId = randomUUID()
      const filePath = join(
        EDITOR_SESSION_DIR,
        `${sessionId}${sanitizeFileExtension(fileName)}`,
      )

      await writeFile(filePath, body)
      const duration = await getMediaDuration(filePath)
      const session = {
        id: sessionId,
        filePath,
        fileName,
        duration,
        nextSegmentId: 2,
        selectedSegmentId: 1,
        segments: [
          {
            id: 1,
            label: 'Clip 1',
            start: 0,
            end: duration,
          },
        ],
      }

      editorSessions.set(sessionId, session)
      sendJson(response, 200, serializeEditorSession(session))
      return
    }

    if (url.pathname === '/api/editor/session/replace') {
      const payload = parseJsonBody(body)
      const sessionId =
        typeof payload?.sessionId === 'string' ? payload.sessionId : ''
      const selectedSegmentId = Number(payload?.selectedSegmentId ?? 0)
      const session = getEditorSession(sessionId)
      const nextSegments = relabelEditorSegments(
        sanitizeEditorSegments(payload?.segments),
      )

      session.segments = nextSegments
      session.selectedSegmentId =
        Number.isFinite(selectedSegmentId) && selectedSegmentId > 0
          ? selectedSegmentId
          : nextSegments[0]?.id ?? null
      session.nextSegmentId = Math.max(
        session.nextSegmentId,
        ...nextSegments.map((segment) => segment.id + 1),
      )

      sendJson(response, 200, serializeEditorSession(session))
      return
    }

    if (url.pathname === '/api/editor/append') {
      const sessionId = url.searchParams.get('sessionId') || ''
      const session = getEditorSession(sessionId)
      const rawFileName = request.headers['x-file-name']
      const fileName =
        typeof rawFileName === 'string' && rawFileName.length > 0
          ? decodeURIComponent(rawFileName)
          : 'append.bin'
      const appendedInputPath = join(
        EDITOR_SESSION_DIR,
        `${randomUUID()}${sanitizeFileExtension(fileName)}`,
      )
      const combinedOutputPath = join(
        EDITOR_SESSION_DIR,
        `${session.id}-timeline-${Date.now()}.mp4`,
      )

      await writeFile(appendedInputPath, body)

      try {
        const appendedDuration = await getMediaDuration(appendedInputPath)
        const nextSegment = {
          id: session.nextSegmentId,
          label: `Clip ${session.segments.length + 1}`,
          start: session.duration,
          end: session.duration + appendedDuration,
        }

        await appendEditorMedia(session.filePath, appendedInputPath, combinedOutputPath)

        const previousFilePath = session.filePath
        session.filePath = combinedOutputPath
        session.fileName = `${sanitizeBaseName(session.fileName)}-timeline.mp4`
        session.duration += appendedDuration
        session.nextSegmentId += 1
        session.segments = relabelEditorSegments([...session.segments, nextSegment])
        session.selectedSegmentId = nextSegment.id

        if (previousFilePath !== combinedOutputPath) {
          await rm(previousFilePath, { force: true }).catch(() => undefined)
        }

        sendJson(response, 200, serializeEditorSession(session))
      } finally {
        await rm(appendedInputPath, { force: true }).catch(() => undefined)
      }
      return
    }

    if (url.pathname === '/api/editor/split') {
      const payload = parseJsonBody(body)
      const sessionId =
        typeof payload?.sessionId === 'string' ? payload.sessionId : ''
      const segmentId = Number(payload?.segmentId ?? 0)
      const splitTime = Number(payload?.splitTime ?? 0)
      const session = getEditorSession(sessionId)
      const splitIndex = session.segments.findIndex(
        (segment) => segment.id === segmentId,
      )

      if (splitIndex === -1) {
        throw new Error('Selected clip was not found in the editor session.')
      }

      const target = session.segments[splitIndex]
      const minGap = 0.1
      if (splitTime <= target.start + minGap || splitTime >= target.end - minGap) {
        throw new Error('Move the playhead inside the clip before splitting.')
      }

      const leftSegment = {
        id: session.nextSegmentId,
        label: target.label,
        start: target.start,
        end: splitTime,
      }
      const rightSegment = {
        id: session.nextSegmentId + 1,
        label: target.label,
        start: splitTime,
        end: target.end,
      }

      session.nextSegmentId += 2
      session.segments.splice(splitIndex, 1, leftSegment, rightSegment)
      session.segments = relabelEditorSegments(session.segments)
      session.selectedSegmentId = rightSegment.id

      sendJson(response, 200, serializeEditorSession(session))
      return
    }

    if (url.pathname === '/api/editor/export') {
      const payload = parseJsonBody(body)
      const sessionId =
        typeof payload?.sessionId === 'string' ? payload.sessionId : ''
      const session = getEditorSession(sessionId)
      const subtitles = sanitizeSubtitleSegments(payload?.subtitles)
      const outputPath = await renderEditorSession(session, subtitles)

      try {
        const data = await readFile(outputPath)
        sendBinary(
          response,
          200,
          data,
          'video/mp4',
          buildEditorExportName(session),
        )
      } finally {
        await rm(outputPath, { force: true }).catch(() => undefined)
      }
      return
    }

    const model = (url.searchParams.get('model') || 'base').trim()
    const language = (url.searchParams.get('language') || '').trim()
    const rawFileName = request.headers['x-file-name']
    const fileName =
      typeof rawFileName === 'string' && rawFileName.length > 0
        ? decodeURIComponent(rawFileName)
        : 'upload.bin'
    tempFilePath = join(
      TEMP_DIR,
      `${randomUUID()}${sanitizeFileExtension(fileName)}`,
    )

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
    if (tempFilePath) {
      await rm(tempFilePath, { force: true }).catch(() => undefined)
    }
  }
})

server.listen(PORT, HOST, () => {
  console.log(`VidVersity subtitle API running at http://${HOST}:${PORT}`)
  console.log(`Using Python: ${PYTHON_BIN}`)
})
