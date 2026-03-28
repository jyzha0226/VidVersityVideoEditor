/**
 * @file SubtitleManager.tsx
 * @description UI panel for generating, editing, and reviewing subtitle segments.
 */

import React, { useState } from 'react'
import type {
  SubtitleGenerationOptions,
  SubtitleSegment,
} from '../../subtitles/types'

export type SubtitleStatus = 'idle' | 'processing' | 'success' | 'error'

interface SubtitleManagerProps {
  segments: SubtitleSegment[]
  status: SubtitleStatus
  hasVideo: boolean
  errorMessage?: string | null
  canExport: boolean
  onGenerateAuto: (options: SubtitleGenerationOptions) => void
  onExportSrt: () => void
  onExportVtt: () => void
  onUpdateSegment: (segment: SubtitleSegment) => void
  onDeleteSegment: (id: string) => void
  onSeekTo: (timeInSeconds: number) => void
}

const MODEL_OPTIONS = [
  { value: 'tiny', label: 'tiny' },
  { value: 'tiny.en', label: 'tiny.en' },
  { value: 'base', label: 'base' },
  { value: 'base.en', label: 'base.en' },
  { value: 'small', label: 'small' },
  { value: 'medium', label: 'medium' },
  { value: 'large-v3', label: 'large-v3' },
]

function formatDisplayTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds < 0) return '00:00'
  const whole = Math.floor(seconds)
  const mm = Math.floor(whole / 60)
  const ss = whole % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(mm)}:${pad(ss)}`
}

function statusLabel(status: SubtitleStatus): string {
  switch (status) {
    case 'processing':
      return 'Generating subtitles...'
    case 'success':
      return 'Subtitles ready'
    case 'error':
      return 'Generation failed'
    default:
      return 'Idle'
  }
}

function statusBadgeClass(status: SubtitleStatus): string {
  if (status === 'processing') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
  }
  if (status === 'success') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
  }
  if (status === 'error') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

export function SubtitleManager({
  segments,
  status,
  hasVideo,
  errorMessage,
  canExport,
  onGenerateAuto,
  onExportSrt,
  onExportVtt,
  onUpdateSegment,
  onDeleteSegment,
  onSeekTo,
}: SubtitleManagerProps): JSX.Element {
  const [model, setModel] = useState<string>('tiny.en')
  const [language, setLanguage] = useState<string>('en')
  const disabledGenerate = !hasVideo || status === 'processing'
  const disabledExport = !canExport || segments.length === 0

  return (
    <section className="mx-auto mt-2 flex w-full max-w-6xl flex-col rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Auto subtitles
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Generate subtitle segments with a local Faster-Whisper service, then
            edit text and jump the playhead to each cue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
              status,
            )}`}
          >
            {statusLabel(status)}
          </span>
          <button
            type="button"
            onClick={() => onGenerateAuto({ model, language })}
            disabled={disabledGenerate}
            className="rounded-md bg-sky-600 px-3 py-1 text-[11px] font-medium text-slate-50 shadow-sm transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          >
            Generate subtitles
          </button>
          <button
            type="button"
            onClick={onExportSrt}
            disabled={disabledExport}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          >
            Export .srt
          </button>
          <button
            type="button"
            onClick={onExportVtt}
            disabled={disabledExport}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          >
            Export .vtt
          </button>
        </div>
      </header>

      <div className="mb-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-[minmax(0,180px)_minmax(0,140px)_1fr]">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Model
          </span>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none ring-offset-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Language
          </span>
          <input
            value={language}
            onChange={(event) => setLanguage(event.target.value.trim() || 'auto')}
            placeholder="auto or en"
            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 outline-none ring-offset-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>

        <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          The editor sends your selected local video to a local subtitle API at
          `http://localhost:8787`, which runs a Python `faster-whisper` worker
          and returns subtitle segments as JSON.
        </div>
      </div>

      {!hasVideo ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          Upload a video above to enable subtitle generation.
        </div>
      ) : segments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No subtitles yet. Start the local Faster-Whisper API, then click
          <span className="font-semibold"> Generate subtitles</span>.
        </div>
      ) : (
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {segments.map((segment) => (
            <article
              key={segment.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-400 hover:bg-sky-50/60 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-sky-500/80 dark:hover:bg-slate-900"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                    {formatDisplayTime(segment.start)} -{' '}
                    {formatDisplayTime(segment.end)}
                  </span>
                  <span className="hidden text-[10px] text-slate-400 md:inline">
                    Subtitle
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSeekTo(segment.start)}
                    className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-50 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Go to
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSegment(segment.id)}
                    className="rounded-md border border-red-500/70 px-2 py-0.5 text-[10px] text-red-600 hover:bg-red-50 dark:border-red-500/60 dark:text-red-300 dark:hover:bg-red-950/60"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <textarea
                value={segment.text}
                onChange={(event) =>
                  onUpdateSegment({ ...segment, text: event.target.value })
                }
                className="h-14 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 outline-none ring-offset-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500"
                placeholder="Subtitle text..."
              />
            </article>
          ))}
        </div>
      )}

      {errorMessage ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <footer className="mt-3 border-t border-slate-200 pt-2 text-[10px] leading-snug text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Install Python requirements from `requirements-faster-whisper.txt`, run
        `npm run subtitles:server`, and keep the API running while you generate
        subtitles from the editor. After editing, click `Export .srt` or
        `Export .vtt` to download the subtitle file.
      </footer>
    </section>
  )
}

export default SubtitleManager
