import type { SubtitleSegment } from './types'

function parseTimestamp(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  const parts = normalized.split(':')

  if (parts.length < 2 || parts.length > 3) {
    return null
  }

  const numbers = parts.map((part) => Number(part))
  if (numbers.some((value) => !Number.isFinite(value))) {
    return null
  }

  if (numbers.length === 2) {
    const [minutes, seconds] = numbers
    return minutes * 60 + seconds
  }

  const [hours, minutes, seconds] = numbers
  return hours * 3600 + minutes * 60 + seconds
}

function normalizeSubtitleText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join(' ')
    .trim()
}

function parseSubtitleContent(content: string): SubtitleSegment[] {
  const normalized = content.replace(/\r\n/g, '\n').trim()
  const cleaned = normalized.startsWith('WEBVTT')
    ? normalized.replace(/^WEBVTT[^\n]*\n+/i, '')
    : normalized

  const blocks = cleaned.split(/\n{2,}/)
  const segments: SubtitleSegment[] = []

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length < 2) {
      continue
    }

    const timeLineIndex = lines.findIndex((line) => line.includes('-->'))
    if (timeLineIndex === -1) {
      continue
    }

    const [rawStart, rawEnd] = lines[timeLineIndex].split('-->').map((part) => part.trim())
    const start = parseTimestamp(rawStart)
    const end = parseTimestamp(rawEnd)

    if (start == null || end == null || end <= start) {
      continue
    }

    const text = normalizeSubtitleText(lines.slice(timeLineIndex + 1).join('\n'))
    segments.push({
      id: `imported-${segments.length}`,
      start,
      end,
      text: text || '...',
    })
  }

  return segments
}

export async function importSubtitlesFromFile(
  file: File,
): Promise<SubtitleSegment[]> {
  const content = await file.text()
  const segments = parseSubtitleContent(content)

  if (segments.length === 0) {
    throw new Error('No valid subtitle cues were found in that file.')
  }

  return segments
}
