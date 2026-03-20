/**
 * @file ClipItem.tsx
 * @description Presentational component rendering a single clip segment in the timeline.
 */

import React from 'react'
import type { ClipSegment } from './types'

/**
 * @description Props for the ClipItem component.
 */
interface ClipItemProps {
  segment: ClipSegment
  isSelected: boolean
  isPlayheadInside: boolean
  flexGrow: number
  onSelect: () => void
}

/**
 * @description A single clickable clip in the visual timeline row.
 */
export function ClipItem({
  segment,
  isSelected,
  isPlayheadInside,
  flexGrow,
  onSelect,
}: ClipItemProps): JSX.Element {
  const durationSecs = segment.end - segment.start

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ flexGrow }}
      className={`group relative flex items-center justify-center rounded-[3px] border text-[10px] transition-colors ${
        isSelected
          ? 'border-sky-500 bg-sky-600/80 text-slate-50 dark:border-sky-400 dark:bg-sky-600/80'
          : 'border-slate-300 bg-slate-100 text-slate-900 hover:border-sky-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-700'
      }`}
    >
      {isPlayheadInside && (
        <span className="absolute inset-y-0 left-1 w-[2px] rounded-full bg-emerald-500 dark:bg-emerald-300" />
      )}
      <span className="truncate px-1">
        {segment.label} ({durationSecs.toFixed(1)}s)
      </span>
    </button>
  )
}
