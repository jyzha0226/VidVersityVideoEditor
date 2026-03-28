import type {
  SubtitleGenerationOptions,
  SubtitleSegment,
} from './types'

interface SubtitleApiResponse {
  segments?: Array<{
    id?: string
    start?: number
    end?: number
    text?: string
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
