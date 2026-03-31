/**
 * @file TimelinePanel.tsx
 * @description Central tools and interactive timeline panel wired to real video state.
 */

import React, { useEffect, useState } from 'react'
import type { ClipSegment } from './types'
import { ClipList } from './ClipList'
import { PlayheadBar } from './PlayheadBar'

/**
 * @description Props linking the timeline to the real video state.
 */
interface TimelinePanelProps {
  /**
   * @description Total video duration in seconds; null when no video is loaded.
   */
  duration: number | null
  /**
   * @description Current video playhead time in seconds.
   */
  currentTime: number
  /**
   * @description Request the video to seek to a specific time in seconds.
   */
  onSeek: (timeInSeconds: number) => void
}

/**
 * @description Main timeline panel component handling editing actions and segment state.
 */
export function TimelinePanel({
  duration,
  currentTime,
  onSeek,
}: TimelinePanelProps): JSX.Element {
  const [segments, setSegments] = useState<ClipSegment[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  /**
   * @description Initialize timeline segments when a video duration becomes available.
   * Uses a single full-length segment as the starting point.
   */
  useEffect(() => {
    if (duration && duration > 0 && segments.length === 0) {
      const total = Math.floor(duration)
      const initialSegment: ClipSegment = {
        id: 1,
        label: 'Full video',
        start: 0,
        end: total,
      }
      setSegments([initialSegment])
      setSelectedId(initialSegment.id)
    }
  }, [duration, segments.length])

  const totalDuration =
    segments.length > 0
      ? segments[segments.length - 1].end - segments[0].start
      : 0

  const selectedSegment =
    segments.find((segment) => segment.id === selectedId) ?? null

  /**
   * @description Split the selected segment at the current video playhead.
   * Only works if playhead lies safely inside the selected segment.
   * After splitting, automatically selects the closer half and seeks to the playhead.
   */
  const handleSplitAtPlayhead = (): void => {
    if (!selectedSegment) return
    if (!duration || duration <= 0) return

    const playhead = currentTime
    const { start, end } = selectedSegment
    const minGap = 0.5

    if (playhead <= start + minGap || playhead >= end - minGap) {
      return
    }

    let nextSelectedId: number | null = null

    setSegments((prev) => {
      const next: ClipSegment[] = []
      for (const segment of prev) {
        if (segment.id !== selectedSegment.id) {
          next.push(segment)
        } else {
          const leftId = Date.now()
          const rightId = leftId + 1
          const left: ClipSegment = {
            id: leftId,
            label: `${segment.label} (A)`,
            start: segment.start,
            end: playhead,
          }
          const right: ClipSegment = {
            id: rightId,
            label: `${segment.label} (B)`,
            start: playhead,
            end: segment.end,
          }

          // 选中更靠近当前播放点的半段（通常是右半段）
          const middle = (left.start + right.end) / 2
          nextSelectedId = playhead >= middle ? rightId : leftId

          next.push(left, right)
        }
      }
      return next
    })

    if (nextSelectedId !== null) {
      setSelectedId(nextSelectedId)
    }

    // 强制让视频跳到当前剪切位置，便于立即预览
    onSeek(playhead)
  }

  /**
   * @description Trim the start of the selected segment to the current playhead, if valid.
   * After trimming, seek to the new start boundary.
   */
  const handleTrimStart = (): void => {
    if (!selectedSegment) return
    const playhead = currentTime
    const { start, end } = selectedSegment

    if (playhead <= start || playhead >= end - 0.5) {
      return
    }

    const newStart = Math.min(end - 0.5, playhead)

    setSegments((prev) =>
      prev.map((segment) => {
        if (segment.id !== selectedSegment.id) return segment
        return { ...segment, start: newStart }
      }),
    )

    // 剪掉开头后，强制跳到新的片头位置
    onSeek(newStart)
  }

  /**
   * @description Trim the end of the selected segment to the current playhead, if valid.
   * After trimming, seek to the new end boundary.
   */
  const handleTrimEnd = (): void => {
    if (!selectedSegment) return
    const playhead = currentTime
    const { start, end } = selectedSegment

    if (playhead >= end || playhead <= start + 0.5) {
      return
    }

    const newEnd = Math.max(start + 0.5, playhead)

    setSegments((prev) =>
      prev.map((segment) => {
        if (segment.id !== selectedSegment.id) return segment
        return { ...segment, end: newEnd }
      }),
    )

    // 剪掉结尾后，强制跳到新的片尾位置
    onSeek(newEnd)
  }

  /**
   * @description Merge the selected segment with the next one on the right.
   */
  const handleMergeWithNext = (): void => {
    if (!selectedSegment) return

    setSegments((prev) => {
      const index = prev.findIndex(
        (segment) => segment.id === selectedSegment.id,
      )
      if (index === -1 || index === prev.length - 1) return prev

      const current = prev[index]
      const nextSeg = prev[index + 1]

      const merged: ClipSegment = {
        id: Date.now(),
        label: `${current.label} + ${nextSeg.label}`,
        start: current.start,
        end: nextSeg.end,
      }

      const copy = [...prev]
      copy.splice(index, 2, merged)
      return copy
    })
  }

  /**
   * @description Delete the selected segment from the timeline.
   */
  const handleDeleteClip = (): void => {
    if (!selectedSegment) return

    setSegments((prev) => {
      const filtered = prev.filter(
        (segment) => segment.id !== selectedSegment.id,
      )
      if (filtered.length === 0) {
        setSelectedId(null)
        return []
      }
      const index = prev.findIndex(
        (segment) => segment.id === selectedSegment.id,
      )
      const newIndex = Math.min(index, filtered.length - 1)
      const newSelected = filtered[newIndex]
      setSelectedId(newSelected.id)
      return filtered
    })
  }

  const canMergeWithNext =
    selectedSegment != null &&
    segments.findIndex((segment) => segment.id === selectedSegment.id) <
      segments.length - 1

  const hasVideo = duration != null && duration > 0

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Editing tools
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Split, trim, and rearrange segments along the timeline. All actions
            use the real video playhead.
          </p>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSplitAtPlayhead}
          disabled={!selectedSegment || !hasVideo}
          className="rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        >
          Split at playhead
        </button>
        <button
          type="button"
          onClick={handleTrimStart}
          disabled={!selectedSegment || !hasVideo}
          className="rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        >
          Trim start
        </button>
        <button
          type="button"
          onClick={handleTrimEnd}
          disabled={!selectedSegment || !hasVideo}
          className="rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        >
          Trim end
        </button>
        <button
          type="button"
          onClick={handleMergeWithNext}
          disabled={!canMergeWithNext || !hasVideo}
          className="rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        >
          Merge with next(placeHolder)
        </button>
        <button
          type="button"
          onClick={handleDeleteClip}
          disabled={!selectedSegment || !hasVideo}
          className="rounded-md bg-red-600 px-3 py-1 text-[11px] text-slate-50 hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
        >
          Delete clip
        </button>
      </div>

      <div className="mb-4 flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
        {!hasVideo ? (
          <div className="flex h-full items-center justify-center text-center text-[11px] text-slate-500 dark:text-slate-400">
            Upload a video to see and edit the timeline. Actions will use the
            real playhead from the video above.
          </div>
        ) : segments.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-[11px] text-slate-500 dark:text-slate-400">
            Timeline is empty. Use the AI panel or upload a video to generate
            new segments.
          </div>
        ) : (
          <>
            <PlayheadBar
              totalDuration={totalDuration}
              currentTime={currentTime}
            />
            <ClipList
              segments={segments}
              selectedId={selectedId}
              currentTime={currentTime}
              onClipClick={(segment) => {
                setSelectedId(segment.id)
                onSeek(segment.start)
              }}
            />

            {selectedSegment && (
              <div className="rounded-md bg-slate-100 p-2 text-[11px] text-slate-700 dark:bg-slate-950/80 dark:text-slate-300">
                <p className="mb-1 text-[11px] font-medium text-slate-900 dark:text-slate-100">
                  Selected clip
                </p>
                <p>
                  <span className="font-semibold">Label:</span>{' '}
                  {selectedSegment.label}
                </p>
                <p>
                  <span className="font-semibold">Range:</span>{' '}
                  {selectedSegment.start.toFixed(1)}s –{' '}
                  {selectedSegment.end.toFixed(1)}s (
                  {(selectedSegment.end - selectedSegment.start).toFixed(1)}
                  s)
                </p>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-500">
                  Tip: Move the playhead in the video above, then use Split /
                  Trim to cut this clip at the current time.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p className="mb-2 font-medium text-slate-900 dark:text-slate-200">
          Cloud workflow
        </p>
        <p className="mb-2">
          Connect this editor to your backend to upload source footage, stream
          proxy files, and export final renders via FFmpeg.wasm or WebCodecs
          based on the timeline structure shown above.
        </p>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1 text-[11px] text-slate-50 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          Save edit to cloud (placeholder)
        </button>
      </footer>
    </section>
  )
}
