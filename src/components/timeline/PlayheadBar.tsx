/**
 * @file PlayheadBar.tsx
 * @description Displays summary information above the clip list: total duration and current playhead time.
 */

import React from 'react'

/**
 * @description Props for the PlayheadBar component.
 */
interface PlayheadBarProps {
  totalDuration: number
  currentTime: number
}

/**
 * @description Small header row showing total duration and current playhead.
 */
export function PlayheadBar({
  totalDuration,
  currentTime,
}: PlayheadBarProps): JSX.Element {
  return (
    <div className="mb-2 flex items-center justify-between text-[11px]">
      <span className="font-medium text-slate-900 dark:text-slate-200">
        Timeline (linked to video)
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        Total duration: {totalDuration.toFixed(1)}s • Playhead:{' '}
        {currentTime.toFixed(1)}s
      </span>
    </div>
  )
}
