/**
 * @file ClipList.tsx
 * @description Renders a list of ClipItem components within the timeline bar.
 */

import React from 'react'
import type { ClipSegment } from './types'
import { ClipItem } from './ClipItem'

/**
 * @description Props for the ClipList component.
 */
interface ClipListProps {
  segments: ClipSegment[]
  selectedId: number | null
  currentTime: number
  onClipClick: (segment: ClipSegment) => void
}

/**
 * @description Horizontal list of clips, sized proportionally to their duration.
 */
export function ClipList({
  segments,
  selectedId,
  currentTime,
  onClipClick,
}: ClipListProps): JSX.Element {
  return (
    <div className="mb-3 flex h-10 items-stretch gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950/80">
      {segments.map((segment) => {
        const durationSecs = segment.end - segment.start
        const flexGrow = Math.max(1, durationSecs)
        const isSelected = segment.id === selectedId
        const isPlayheadInside =
          currentTime >= segment.start && currentTime <= segment.end

        return (
          <ClipItem
            key={segment.id}
            segment={segment}
            isSelected={isSelected}
            isPlayheadInside={isPlayheadInside}
            flexGrow={flexGrow}
            onSelect={() => onClipClick(segment)}
          />
        )
      })}
    </div>
  )
}
