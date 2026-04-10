import type {
  SubtitleGenerationOptions,
  SubtitleSegment,
} from './types'

export interface AudioActivitySegment {
  start_time?: number
  end_time?: number
  label?: string
  confidence?: number | null
}

export interface AudioActivityDetectionResult {
  audioDuration: number
  silenceSegments: Array<{
    start: number
    end: number
    label: string
    confidence: number | null
  }>
  speechSegments: Array<{
    start: number
    end: number
    label: string
    confidence: number | null
  }>
}

export interface EditorClipSegment {
  id: number
  label: string
  start: number
  end: number
}

export interface EditorSessionState {
  sessionId: string
  duration: number
  selectedSegmentId: number | null
  segments: EditorClipSegment[]
}

export interface RenderedEditorVideo {
  blob: Blob
  fileName: string
}

interface SubtitleApiResponse {
  segments?: Array<{
    id?: string
    start?: number
    end?: number
    text?: string
  }>
  error?: string
}

interface AudioActivityApiResponse {
  audioDuration?: number
  silenceSegments?: AudioActivitySegment[]
  speechSegments?: AudioActivitySegment[]
  error?: string
}

interface EditorSessionApiResponse {
  sessionId?: string
  duration?: number
  selectedSegmentId?: number | null
  segments?: Array<{
    id?: number
    label?: string
    start?: number
    end?: number
  }>
  error?: string
}

const DEFAULT_SUBTITLE_API_URL = 'http://localhost:8787'

function resolveSubtitleApiUrl(): string {
  const configured = (globalThis as typeof globalThis & {
    __VIDVERSITY_SUBTITLE_API__?: string
  }).__VIDVERSITY_SUBTITLE_API__

  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, '')
  }

  return DEFAULT_SUBTITLE_API_URL
}

function normalizeSegments(
  segments: SubtitleApiResponse['segments'],
): SubtitleSegment[] {
  if (!segments || segments.length === 0) {
    return []
  }

  return segments
    .map((segment, index) => ({
      id: segment.id?.trim() || `segment-${index}`,
      start: Number(segment.start ?? 0),
      end: Number(segment.end ?? 0),
      text: segment.text?.trim() ?? '',
    }))
    .filter(
      (segment) =>
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        segment.end > segment.start,
    )
}

function normalizeAudioActivitySegments(
  segments: AudioActivityApiResponse['silenceSegments'],
) {
  if (!segments || segments.length === 0) {
    return []
  }

  return segments
    .map((segment) => ({
      start: Number(segment.start_time ?? 0),
      end: Number(segment.end_time ?? 0),
      label: segment.label?.trim() || 'silence',
      confidence:
        segment.confidence == null ? null : Number(segment.confidence),
    }))
    .filter(
      (segment) =>
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        segment.end > segment.start,
    )
}

function normalizeEditorSegments(
  segments: EditorSessionApiResponse['segments'],
): EditorClipSegment[] {
  if (!segments || segments.length === 0) {
    return []
  }

  return segments
    .map((segment, index) => ({
      id: Number(segment.id ?? index + 1),
      label: segment.label?.trim() || `Clip ${index + 1}`,
      start: Number(segment.start ?? 0),
      end: Number(segment.end ?? 0),
    }))
    .filter(
      (segment) =>
        Number.isFinite(segment.id) &&
        Number.isFinite(segment.start) &&
        Number.isFinite(segment.end) &&
        segment.end > segment.start,
    )
}

function normalizeEditorSession(
  payload: EditorSessionApiResponse | null,
): EditorSessionState {
  const segments = normalizeEditorSegments(payload?.segments)

  return {
    sessionId: `${payload?.sessionId ?? ''}`,
    duration: Number(payload?.duration ?? 0),
    selectedSegmentId:
      payload?.selectedSegmentId == null
        ? segments[0]?.id ?? null
        : Number(payload.selectedSegmentId),
    segments,
  }
}

export async function generateSubtitlesFromVideo(
  file: File,
  options: SubtitleGenerationOptions,
): Promise<SubtitleSegment[]> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const searchParams = new URLSearchParams()
  searchParams.set('model', options.model)
  if (options.language && options.language !== 'auto') {
    searchParams.set('language', options.language)
  }

  const response = await fetch(
    `${apiBaseUrl}/api/subtitles/generate?${searchParams.toString()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: file,
    },
  )

  const payload = (await response.json().catch(() => null)) as
    | SubtitleApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        'Subtitle generation failed. Check that the local Faster-Whisper service is running.',
    )
  }

  const segments = normalizeSegments(payload?.segments)
  if (segments.length === 0) {
    throw new Error('No subtitle segments were returned for this video.')
  }

  return segments
}

export async function detectSilenceFromVideo(
  file: File,
  options?: {
    noiseThresholdDb?: number
    minSilenceDuration?: number
    minSegmentDuration?: number
  },
): Promise<AudioActivityDetectionResult> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const searchParams = new URLSearchParams()

  if (options?.noiseThresholdDb != null) {
    searchParams.set('noiseThresholdDb', `${options.noiseThresholdDb}`)
  }
  if (options?.minSilenceDuration != null) {
    searchParams.set('minSilenceDuration', `${options.minSilenceDuration}`)
  }
  if (options?.minSegmentDuration != null) {
    searchParams.set('minSegmentDuration', `${options.minSegmentDuration}`)
  }

  const suffix = searchParams.toString()
  const response = await fetch(
    `${apiBaseUrl}/api/audio/detect-silence${suffix ? `?${suffix}` : ''}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: file,
    },
  )

  const payload = (await response.json().catch(() => null)) as
    | AudioActivityApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        'Silence detection failed. Check that the local backend and FFmpeg are available.',
    )
  }

  return {
    audioDuration: Number(payload?.audioDuration ?? 0),
    silenceSegments: normalizeAudioActivitySegments(payload?.silenceSegments),
    speechSegments: normalizeAudioActivitySegments(payload?.speechSegments).map(
      (segment) => ({ ...segment, label: 'speech' }),
    ),
  }
}

export async function createEditorSessionFromVideo(
  file: File,
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/session`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        'Could not create an editor session for this video.',
    )
  }

  const session = normalizeEditorSession(payload)
  if (!session.sessionId || session.segments.length === 0) {
    throw new Error('Editor session was created without any clip segments.')
  }

  return session
}

export async function replaceEditorSessionSegments(
  sessionId: string,
  segments: EditorClipSegment[],
  selectedSegmentId: number | null,
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/session/replace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      selectedSegmentId,
      segments,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not update the editor session.',
    )
  }

  return normalizeEditorSession(payload)
}

export async function splitEditorSessionAtTime(
  sessionId: string,
  segmentId: number,
  splitTime: number,
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/split`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      segmentId,
      splitTime,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not split the selected clip.',
    )
  }

  return normalizeEditorSession(payload)
}

export async function exportEditorSessionVideo(
  sessionId: string,
): Promise<RenderedEditorVideo> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(
      payload?.error || 'Could not export the edited video.',
    )
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('Content-Disposition') || ''
  const match = contentDisposition.match(/filename="([^"]+)"/i)
  const fileName = match?.[1] || 'vidversity-edited.mp4'

  return { blob, fileName }
}

export async function appendVideoToEditorSession(
  sessionId: string,
  file: File,
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const encodedSessionId = encodeURIComponent(sessionId)
  const response = await fetch(
    `${apiBaseUrl}/api/editor/append?sessionId=${encodedSessionId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: file,
    },
  )

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not append the uploaded video to the editor timeline.',
    )
  }

  return normalizeEditorSession(payload)
}

export async function downloadEditorSessionSourceFile(
  sessionId: string,
): Promise<File> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const encodedSessionId = encodeURIComponent(sessionId)
  const response = await fetch(
    `${apiBaseUrl}/api/editor/source?sessionId=${encodedSessionId}`,
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(
      payload?.error || 'Could not load the current editor source media.',
    )
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('Content-Disposition') || ''
  const match = contentDisposition.match(/filename="([^"]+)"/i)
  const fileName = match?.[1] || 'vidversity-editor-source.mp4'

  return new File([blob], fileName, {
    type: blob.type || 'video/mp4',
  })
}
