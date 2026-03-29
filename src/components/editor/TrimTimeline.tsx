import React from 'react'
import { Scissors } from 'lucide-react'

export interface TrimmedClip {
  id: string
  start: number
  end: number
}

interface TrimTimelineProps {
  duration: number | null
  currentTime: number
  hasVideo: boolean
  trimStart: number
  trimEnd: number
  trimmedClips: TrimmedClip[]
  onSeek: (timeInSeconds: number) => void
  onChangeTrimStart: (timeInSeconds: number) => void
  onChangeTrimEnd: (timeInSeconds: number) => void
  onTrim: () => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const whole = Math.floor(seconds)
  const mm = Math.floor(whole / 60)
  const ss = whole % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function TrimTimeline({
  duration,
  currentTime,
  hasVideo,
  trimStart,
  trimEnd,
  trimmedClips,
  onSeek,
  onChangeTrimStart,
  onChangeTrimEnd,
  onTrim,
}: TrimTimelineProps): JSX.Element {
  const safeDuration = duration && duration > 0 ? duration : 0
  const selectionWidth =
    safeDuration > 0 ? Math.max(0, ((trimEnd - trimStart) / safeDuration) * 100) : 0
  const selectionLeft = safeDuration > 0 ? (trimStart / safeDuration) * 100 : 0
  const playheadLeft =
    safeDuration > 0 ? Math.min(100, Math.max(0, (currentTime / safeDuration) * 100)) : 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Trim controls
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Drag both playheads to keep the middle section, then click Trim.
          </p>
        </div>

        <button
          type="button"
          onClick={onTrim}
          disabled={!hasVideo || trimEnd - trimStart < 0.5}
          aria-label="Trim video to selected range"
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800"
        >
          <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Trim</span>
        </button>
      </header>

      {!hasVideo ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          Upload a video first to enable timeline trimming.
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Start: {formatTime(trimStart)}</span>
              <span>Current: {formatTime(currentTime)}</span>
              <span>End: {formatTime(trimEnd)}</span>
            </div>

            <div className="relative h-10 rounded-md bg-slate-200/80 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => onSeek(trimStart)}
                className="absolute inset-0 h-full w-full"
                aria-label="Seek video"
              />
              <div
                className="absolute bottom-0 top-0 rounded-md bg-sky-500/35"
                style={{ left: `${selectionLeft}%`, width: `${selectionWidth}%` }}
              />
              <div
                className="absolute bottom-0 top-0 w-0.5 bg-blue-700"
                style={{ left: `${playheadLeft}%` }}
                aria-hidden="true"
              />
            </div>

            <div className="relative mt-3 h-6">
              <input
                type="range"
                min={0}
                max={safeDuration}
                step={0.1}
                value={Math.min(trimStart, trimEnd - 0.1)}
                onChange={(event) => onChangeTrimStart(Number(event.target.value))}
                className="trim-range pointer-events-auto absolute left-0 top-0 h-6 w-full cursor-ew-resize appearance-none bg-transparent"
                aria-label="Left trim playhead"
              />
              <input
                type="range"
                min={0}
                max={safeDuration}
                step={0.1}
                value={Math.max(trimEnd, trimStart + 0.1)}
                onChange={(event) => onChangeTrimEnd(Number(event.target.value))}
                className="trim-range pointer-events-auto absolute left-0 top-0 h-6 w-full cursor-ew-resize appearance-none bg-transparent"
                aria-label="Right trim playhead"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="mb-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              Timeline preview (full video with trimmed outputs)
            </p>
            <div className="relative h-12 rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/70">
              {trimmedClips.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[10px] text-slate-500 dark:text-slate-400">
                  No trimmed clips yet.
                </div>
              ) : (
                trimmedClips.map((clip, index) => {
                  const left = safeDuration > 0 ? (clip.start / safeDuration) * 100 : 0
                  const width =
                    safeDuration > 0 ? ((clip.end - clip.start) / safeDuration) * 100 : 0
                  return (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => onSeek(clip.start)}
                      className="absolute top-1 h-10 rounded-md border border-blue-700/60 bg-blue-500/35 px-2 text-left text-[10px] text-blue-950 hover:bg-blue-500/45 dark:text-blue-100"
                      style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                      aria-label={`Seek to trimmed clip ${index + 1}`}
                    >
                      Clip {index + 1}
                    </button>
                  )
                })
              )}
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>00:00</span>
              <span>{formatTime(safeDuration / 2)}</span>
              <span>{formatTime(safeDuration)}</span>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default TrimTimeline
