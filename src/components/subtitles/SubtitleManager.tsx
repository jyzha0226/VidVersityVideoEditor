/**
 * @file SubtitleManager.tsx
 * @description UI panel for managing subtitles: generation status, list editing, and timeline linkage.
 */

import React from 'react'
import type { SubtitleSegment } from '../../subtitles/types'

/**
 * @description Supported subtitle generation status values.
 */
export type SubtitleStatus = 'idle' | 'processing' | 'success' | 'error'

/**
 * @description Props for the SubtitleManager component.
 */
interface SubtitleManagerProps {
  /** Current list of subtitle segments. */
  segments: SubtitleSegment[]
  /** Status of the (mocked) transcription task. */
  status: SubtitleStatus
  /** Whether a video is currently loaded and ready. */
  hasVideo: boolean
  /** Trigger mock subtitle generation for the current video. */
  onGenerateMock: () => void
  /** Update a single subtitle row. */
  onUpdateSegment: (segment: SubtitleSegment) => void
  /** Delete a subtitle row by its id. */
  onDeleteSegment: (id: string) => void
  /** Seek the video and timeline to a target time in seconds. */
  onSeekTo: (timeInSeconds: number) => void
}

/**
 * @description Format seconds into a compact "MM:SS" string for display.
 * @param seconds - Time value in seconds.
 */
function formatDisplayTime(seconds: number): string {
  if (Number.isNaN(seconds) || seconds < 0) return '00:00'
  const whole = Math.floor(seconds)
  const mm = Math.floor(whole / 60)
  const ss = whole % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(mm)}:${pad(ss)}`
}

/**
 * @description Determine UI label text based on status.
 * @param status - Current subtitle status.
 */
function statusLabel(status: SubtitleStatus): string {
  switch (status) {
    case 'processing':
      return 'Generating subtitles (mock)…'
    case 'success':
      return 'Subtitles ready'
    case 'error':
      return 'Generation failed'
    default:
      return 'Idle'
  }
}

/**
 * @description Determine badge color classes based on status and theme.
 * @param status - Current subtitle status.
 */
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

/**
 * @description Subtitles management panel with generation button, status, and editable list.
 */
export function SubtitleManager({
  segments,
  status,
  hasVideo,
  onGenerateMock,
  onUpdateSegment,
  onDeleteSegment,
  onSeekTo,
}: SubtitleManagerProps): JSX.Element {
  const disabledGenerate = !hasVideo || status === 'processing'

  return (
    <section className="mx-auto mt-2 flex w-full max-w-6xl flex-col rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Subtitles (beta)
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Generate example subtitles for the current video, edit text, and
            jump the playhead to any subtitle time.
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
            onClick={onGenerateMock}
            disabled={disabledGenerate}
            className="rounded-md bg-sky-600 px-3 py-1 text-[11px] font-medium text-slate-50 shadow-sm transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          >
            Generate mock subtitles
          </button>
        </div>
      </header>

      {!hasVideo ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          Upload a video above to enable automatic subtitles. This panel will
          show a mocked transcription result for demo purposes only.
        </div>
      ) : segments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No subtitles yet. Click{' '}
          <span className="font-semibold">Generate mock subtitles</span> to
          simulate a transcription service and populate this list.
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
                    {formatDisplayTime(segment.start)} –{' '}
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
                placeholder="Subtitle text…"
              />
            </article>
          ))}
        </div>
      )}

      <footer className="mt-3 border-t border-slate-200 pt-2 text-[10px] leading-snug text-slate-500 dark:border-slate-800 dark:text-slate-400">
        This is a frontend-only mock. connect this panel to transcription backend (e.g. Whisper or other ASR) and map the returned
        segments to real subtitle tracks and timeline edits.(!!!)
      </footer>
    </section>
  )
}

export default SubtitleManager
