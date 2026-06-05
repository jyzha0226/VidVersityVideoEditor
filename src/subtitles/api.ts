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
  sourceRanges?: Array<{ start: number; end: number }>
}

export interface EditorSessionState {
  sessionId: string
  duration: number
  selectedSegmentId: number | null
  category: string
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
  category?: string
  segments?: Array<{
    id?: number
    label?: string
    start?: number
    end?: number
    sourceRanges?: Array<{ start?: number; end?: number }>
  }>
  error?: string
}

const DEFAULT_SUBTITLE_API_URL = 'http://127.0.0.1:8787'

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
    .map((segment, index) => {
      const sourceRanges = Array.isArray(segment.sourceRanges)
        ? segment.sourceRanges
            .map((range) => ({
              start: Number(range.start),
              end: Number(range.end),
            }))
            .filter(
              (range) =>
                Number.isFinite(range.start) &&
                Number.isFinite(range.end) &&
                range.end > range.start,
            )
        : []

      return {
        id: Number(segment.id ?? index + 1),
        label:
          segment.label?.trim().replace(/^Clip\s+\d+$/i, `Chapter ${index + 1}`) ||
          `Chapter ${index + 1}`,
        start: Number(segment.start ?? sourceRanges[0]?.start ?? 0),
        end: Number(segment.end ?? sourceRanges[sourceRanges.length - 1]?.end ?? 0),
        ...(sourceRanges.length > 0 ? { sourceRanges } : {}),
      }
    })
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
    category:
      typeof payload?.category === 'string' ? payload.category.trim() : '',
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

export async function detectSilenceInEditorSession(
  sessionId: string,
  options?: {
    noiseThresholdDb?: number
    minSilenceDuration?: number
    minSegmentDuration?: number
  },
): Promise<AudioActivityDetectionResult> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/detect-silence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      noiseThresholdDb: options?.noiseThresholdDb,
      minSilenceDuration: options?.minSilenceDuration,
      minSegmentDuration: options?.minSegmentDuration,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | AudioActivityApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        'Silence detection failed for the current timeline.',
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
  category?: string,
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
      category,
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

export async function updateEditorSessionCategory(
  sessionId: string,
  category: string,
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/session/category`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      category,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not update the editor session category.',
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

export async function mergeEditorSessionSegments(
  sessionId: string,
  segmentIds: number[],
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      segmentIds,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not merge the selected clips.',
    )
  }

  return normalizeEditorSession(payload)
}

export async function cutEditorSessionToRange(
  sessionId: string,
  cutStart: number,
  cutEnd: number,
  segmentIds?: number[],
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/cut`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      cutStart,
      cutEnd,
      segmentIds,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not cut the selected timeline range.',
    )
  }

  return normalizeEditorSession(payload)
}

export async function deleteSilenceRangesFromEditorSession(
  sessionId: string,
  silenceSegments: Array<{ start: number; end: number }>,
): Promise<EditorSessionState> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/delete-silence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      silenceSegments,
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | EditorSessionApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not delete the selected silence ranges.',
    )
  }

  return normalizeEditorSession(payload)
}

export async function exportEditorSessionVideo(
  sessionId: string,
  options?: {
    segments?: EditorClipSegment[]
    fileNameSuffix?: string
  },
): Promise<RenderedEditorVideo> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      segments: options?.segments,
      fileNameSuffix: options?.fileNameSuffix,
    }),
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

export interface EditorVersionInfo {
  fileName: string
  displayName: string
  isOriginal: boolean
  isCurrent: boolean
  sizeBytes: number
  createdAt: number
}

interface EditorVersionsApiResponse {
  versions?: Array<{
    fileName?: string
    displayName?: string
    isOriginal?: boolean
    isCurrent?: boolean
    sizeBytes?: number
    createdAt?: number
  }>
  version?: EditorVersionsApiResponse['versions'] extends Array<infer T>
    ? T
    : never
  ok?: boolean
  deleted?: string
  error?: string
}

function normalizeEditorVersions(
  payload: EditorVersionsApiResponse | null,
): EditorVersionInfo[] {
  if (!payload || !Array.isArray(payload.versions)) return []
  return payload.versions
    .map((entry) => ({
      fileName: `${entry?.fileName ?? ''}`,
      displayName: `${entry?.displayName ?? entry?.fileName ?? ''}`,
      isOriginal: Boolean(entry?.isOriginal),
      isCurrent: Boolean(entry?.isCurrent),
      sizeBytes: Number(entry?.sizeBytes ?? 0),
      createdAt: Number(entry?.createdAt ?? 0),
    }))
    .filter((entry) => entry.fileName.length > 0)
}

export async function listEditorSessionVersions(
  sessionId: string,
): Promise<EditorVersionInfo[]> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const encodedSessionId = encodeURIComponent(sessionId)
  const response = await fetch(
    `${apiBaseUrl}/api/editor/versions?sessionId=${encodedSessionId}`,
  )
  const payload = (await response.json().catch(() => null)) as
    | EditorVersionsApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not list editor source versions.',
    )
  }

  return normalizeEditorVersions(payload)
}

export async function deleteEditorSessionVersion(
  sessionId: string,
  versionName: string,
): Promise<EditorVersionInfo[]> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/version/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, versionName }),
  })
  const payload = (await response.json().catch(() => null)) as
    | EditorVersionsApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not delete the selected version.',
    )
  }

  return normalizeEditorVersions(payload)
}

export async function switchEditorSessionVersion(
  sessionId: string,
  versionName: string,
): Promise<{ session: EditorSessionState; versions: EditorVersionInfo[] }> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/version/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, versionName }),
  })
  const payload = (await response.json().catch(() => null)) as
    | (EditorVersionsApiResponse & { session?: EditorSessionApiResponse })
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not switch to the selected version.',
    )
  }

  return {
    session: normalizeEditorSession(payload?.session ?? null),
    versions: normalizeEditorVersions(payload),
  }
}

export async function saveEditorSessionVersion(
  sessionId: string,
  options?: {
    segments?: EditorClipSegment[]
    subtitles?: SubtitleSegment[]
  },
): Promise<{ version: EditorVersionInfo | null; versions: EditorVersionInfo[] }> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const response = await fetch(`${apiBaseUrl}/api/editor/version/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      segments: options?.segments,
      subtitles: options?.subtitles,
    }),
  })
  const payload = (await response.json().catch(() => null)) as
    | EditorVersionsApiResponse
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error || 'Could not save the current edit as a new version.',
    )
  }

  const versions = normalizeEditorVersions(payload)
  const rawVersion = (payload as { version?: unknown } | null)?.version as
    | {
        fileName?: string
        displayName?: string
        isOriginal?: boolean
        isCurrent?: boolean
        sizeBytes?: number
        createdAt?: number
      }
    | null
    | undefined

  const version: EditorVersionInfo | null = rawVersion
    ? {
        fileName: `${rawVersion.fileName ?? ''}`,
        displayName: `${rawVersion.displayName ?? rawVersion.fileName ?? ''}`,
        isOriginal: Boolean(rawVersion.isOriginal),
        isCurrent: Boolean(rawVersion.isCurrent),
        sizeBytes: Number(rawVersion.sizeBytes ?? 0),
        createdAt: Number(rawVersion.createdAt ?? 0),
      }
    : null

  return { version, versions }
}

export async function downloadEditorSessionVersion(
  sessionId: string,
  versionName: string,
): Promise<RenderedEditorVideo> {
  const apiBaseUrl = resolveSubtitleApiUrl()
  const params = new URLSearchParams({ sessionId, versionName })
  const response = await fetch(
    `${apiBaseUrl}/api/editor/version/download?${params.toString()}`,
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(
      payload?.error || 'Could not download the requested version.',
    )
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('Content-Disposition') || ''
  const match = contentDisposition.match(/filename="([^"]+)"/i)
  const fileName = match?.[1] || versionName || 'vidversity-version.mp4'

  return { blob, fileName }
}
