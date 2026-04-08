import type { SubtitleSegment } from './types'

export type SubtitleExportFormat = 'srt' | 'vtt'

function formatTime(seconds: number, millisecondSeparator: ',' | '.'): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000))
  const hours = Math.floor(totalMs / 3_600_000)
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000)
  const secs = Math.floor((totalMs % 60_000) / 1_000)
  const ms = totalMs % 1_000
  const pad = (n: number, size: number) => n.toString().padStart(size, '0')
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}${millisecondSeparator}${pad(ms, 3)}`
}

function sanitizeBaseName(baseName: string): string {
  return (
    baseName
      .trim()
      .replace(/\.[^.]+$/, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_') || 'subtitles'
  )
}

export function buildSrtFromSubtitles(segments: SubtitleSegment[]): string {
  return segments
    .map((segment, index) => {
      const start = formatTime(segment.start, ',')
      const end = formatTime(segment.end, ',')
      const text =
        segment.text && segment.text.trim().length > 0 ? segment.text.trim() : '...'

      return `${index + 1}\n${start} --> ${end}\n${text}`
    })
    .join('\n\n')
}

export function buildVttFromSubtitles(segments: SubtitleSegment[]): string {
  const body = segments
    .map((segment, index) => {
      const start = formatTime(segment.start, '.')
      const end = formatTime(segment.end, '.')
      const text =
        segment.text && segment.text.trim().length > 0 ? segment.text.trim() : '...'

      return `${index + 1}\n${start} --> ${end}\n${text}`
    })
    .join('\n\n')

  return `WEBVTT\n\n${body}`
}

export function downloadSubtitleFile(
  segments: SubtitleSegment[],
  baseName: string,
  format: SubtitleExportFormat,
): void {
  const safeBaseName = sanitizeBaseName(baseName)
  const content =
    format === 'srt'
      ? buildSrtFromSubtitles(segments)
      : buildVttFromSubtitles(segments)
  const mimeType =
    format === 'srt'
      ? 'application/x-subrip;charset=utf-8'
      : 'text/vtt;charset=utf-8'

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeBaseName}.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
