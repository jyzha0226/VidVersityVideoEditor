/**
 * @file AISidebar.tsx
 * @description AI suggestions sidebar for the video editor, showing automatic cut ideas.
 */

import React from 'react'
import { Sparkles, Scissors, Wand2 } from 'lucide-react'

/**
 * @description Props for the AISidebar component.
 */
export interface AISidebarProps {
  /**
   * @description Callback to preview the video at a given time (in seconds).
   */
  onPreviewAt?: (timeInSeconds: number) => void
}

/**
 * @description Allowed kinds of AI suggestion.
 */
type AISuggestionKind = 'scene' | 'silence' | 'transcript'

/**
 * @description Single AI suggestion item definition.
 */
interface AISuggestion {
  id: string
  label: string
  timeRange: string
  description: string
  kind: AISuggestionKind
}

/**
 * @description Hard-coded suggestion items that mimic real AI output.
 */
const SUGGESTIONS: AISuggestion[] = [
  {
    id: 'scene-1',
    label: 'Scene change',
    timeRange: '00:12 - 00:18',
    description: 'Scene change detected between introduction and slides.',
    kind: 'scene',
  },
  {
    id: 'silence-1',
    label: 'Silence segment',
    timeRange: '04:05 - 04:20',
    description: 'Long silence with no speech detected.',
    kind: 'silence',
  },
  {
    id: 'transcript-1',
    label: 'Transcript-based',
    timeRange: '15:00 - 15:30',
    description: 'Repeated explanation that may be shortened.',
    kind: 'transcript',
  },
]

/**
 * @description Parse a "MM:SS" or "HH:MM:SS" time string into seconds.
 */
function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map((part) => Number(part.trim()))
  if (parts.some((n) => Number.isNaN(n))) return 0

  if (parts.length === 2) {
    const [mm, ss] = parts
    return mm * 60 + ss
  }

  if (parts.length === 3) {
    const [hh, mm, ss] = parts
    return hh * 3600 + mm * 60 + ss
  }

  return 0
}

/**
 * @description Extract the start time (in seconds) from a "AA:BB - CC:DD" range.
 */
function getRangeStartInSeconds(range: string): number {
  const [start] = range.split('-')
  return parseTimeToSeconds(start.trim())
}

/**
 * @description Right-side AI suggestions sidebar for the video editor layout.
 */
export function AISidebar({ onPreviewAt }: AISidebarProps) {
  return (
    <aside className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-100">
              AI Suggestions
            </span>
            <span className="text-[10px] text-slate-400">
              Connect your AI services to populate this panel.
            </span>
          </div>
        </div>

        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Beta
        </span>
      </header>

      <div className="mb-2 border-t border-slate-800/80" />

      <section className="space-y-2 overflow-y-auto pb-1">
        {SUGGESTIONS.map((item) => {
          const startSeconds = getRangeStartInSeconds(item.timeRange)

          return (
            <article
              key={item.id}
              className="group rounded-lg border border-slate-800 bg-slate-950/80 p-2 transition-colors hover:border-sky-500/60 hover:bg-slate-900/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-200">
                    {item.kind === 'scene' && (
                      <Wand2 className="h-3 w-3 text-sky-300" />
                    )}
                    {item.kind === 'silence' && (
                      <Scissors className="h-3 w-3 text-amber-300" />
                    )}
                    {item.kind === 'transcript' && (
                      <Sparkles className="h-3 w-3 text-violet-300" />
                    )}
                    <span>{item.label}</span>
                  </span>
                  <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                    {item.timeRange}
                  </span>
                </div>
              </div>

              <p className="mt-1 text-[11px] leading-snug text-slate-300">
                {item.description}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onPreviewAt) {
                      onPreviewAt(startSeconds)
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-1 text-[11px] font-medium text-slate-50 shadow-sm transition-colors hover:bg-sky-500"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Preview
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 opacity-70"
                >
                  <Scissors className="h-3 w-3" />
                  Apply cut (coming soon)
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <footer className="mt-2 border-t border-slate-800/80 pt-2 text-[10px] leading-snug text-slate-500">
        Editors can preview and apply automated cuts, silence removals, and
        transcript-based edits. Connect this to your backend to run your own AI
        pipelines.
      </footer>
    </aside>
  )
}

export default AISidebar
