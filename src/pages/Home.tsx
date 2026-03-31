import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Scissors, Upload, Sparkles, Send, Folder, FileText, Archive, Settings, Search, RotateCcw } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'

interface TrimClip {
  id: number
  segments: Array<{ start: number; end: number }>
  type: 'trim' | 'split' | 'merge'
}

interface ClipSegment {
  start: number
  end: number
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function HomePage(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const trimSliderRef = useRef<HTMLDivElement | null>(null)

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [splitPoint, setSplitPoint] = useState(0)
  const [trimmedClips, setTrimmedClips] = useState<TrimClip[]>([])
  const [activeClipId, setActiveClipId] = useState<number | null>(null)
  const [editorMode, setEditorMode] = useState<'trim' | 'split' | 'merge'>('trim')
  const [mergeSelection, setMergeSelection] = useState<number[]>([])
  const [mergeWarning, setMergeWarning] = useState<string | null>(null)
  const [draggingTrimHandle, setDraggingTrimHandle] = useState<'left' | 'right' | null>(null)

  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  const activeClip = useMemo(
    () => trimmedClips.find((clip) => clip.id === activeClipId) ?? null,
    [trimmedClips, activeClipId],
  )
  const trimStartPercent = videoDuration > 0 ? (trimStart / videoDuration) * 100 : 0
  const trimEndPercent = videoDuration > 0 ? (trimEnd / videoDuration) * 100 : 0

  const getOrderedSegments = (clip: TrimClip): ClipSegment[] =>
    [...clip.segments].sort((a, b) => a.start - b.start)

  const resetClipPlayback = (video: HTMLVideoElement, clip: TrimClip): void => {
    const orderedSegments = getOrderedSegments(clip)
    if (!orderedSegments.length) return
    video.pause()
    video.currentTime = orderedSegments[0].start
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    if (videoUrl) URL.revokeObjectURL(videoUrl)

    const nextUrl = URL.createObjectURL(file)
    setVideoUrl(nextUrl)
    setVideoDuration(0)
    setCurrentTime(0)
    setTrimStart(0)
    setTrimEnd(0)
    setSplitPoint(0)
    setTrimmedClips([])
    setActiveClipId(null)
  }

  const handleTrim = (): void => {
    if (!videoDuration || trimEnd - trimStart < 0.2) return

    const nextClip: TrimClip = {
      id: Date.now(),
      segments: [{ start: trimStart, end: trimEnd }],
      type: 'trim',
    }

    setTrimmedClips((prev) => [...prev, nextClip])
    setActiveClipId(nextClip.id)

    if (videoRef.current) {
      videoRef.current.currentTime = trimStart
      void videoRef.current.play()
    }
  }

  const seekToClip = (clip: TrimClip): void => {
    setActiveClipId(clip.id)
    if (videoRef.current) {
      const orderedSegments = getOrderedSegments(clip)
      if (!orderedSegments.length) return
      videoRef.current.currentTime = orderedSegments[0].start
      void videoRef.current.play()
    }
  }

  const handleSplit = (): void => {
    if (!videoDuration || splitPoint <= 0 || splitPoint >= videoDuration) return

    const first: TrimClip = {
      id: Date.now(),
      segments: [{ start: 0, end: splitPoint }],
      type: 'split',
    }
    const second: TrimClip = {
      id: first.id + 1,
      segments: [{ start: splitPoint, end: videoDuration }],
      type: 'split',
    }

    setTrimmedClips((prev) => [...prev, first, second])
    setActiveClipId(first.id)

    if (videoRef.current) {
      videoRef.current.currentTime = first.segments[0].start
      void videoRef.current.play()
    }
  }

  const showMergeWarning = (message: string): void => {
    setMergeWarning(message)
    window.setTimeout(() => setMergeWarning(null), 1800)
  }

  const handleMergeSelected = (): void => {
    if (mergeSelection.length < 2) {
      showMergeWarning('Select at least 2 clips to merge.')
      return
    }

    const clipsToMerge = trimmedClips.filter((clip) => mergeSelection.includes(clip.id))
    if (clipsToMerge.length < 2) {
      showMergeWarning('Select at least 2 clips to merge.')
      return
    }

    const mergedSegments = clipsToMerge
      .flatMap((clip) => clip.segments)
      .sort((a, b) => a.start - b.start)

    const mergedClip: TrimClip = {
      id: Date.now(),
      type: 'merge',
      segments: mergedSegments,
    }

    setTrimmedClips((prev) => {
      const withoutSelected = prev.filter((clip) => !mergeSelection.includes(clip.id))
      return [...withoutSelected, mergedClip]
    })
    setMergeSelection([])
    setActiveClipId(mergedClip.id)

    if (videoRef.current) {
      const orderedSegments = getOrderedSegments(mergedClip)
      if (!orderedSegments.length) return
      videoRef.current.currentTime = orderedSegments[0].start
      void videoRef.current.play()
    }
  }

  return (
    <div className="min-h-screen bg-[#eef0f4] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex h-14 items-center justify-between bg-fuchsia-600 px-6 text-white">
        <h1 className="text-3xl font-bold tracking-tight">Vidversity</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
          >
            {theme === 'dark' ? 'Dark mode' : 'Guided mode'}
          </button>
          <div className="h-8 w-8 rounded-full bg-white/90" />
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-56px)] grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="border-r border-slate-300/80 bg-slate-100/80 p-5 dark:border-slate-800 dark:bg-slate-900">
          <button className="mb-8 w-full rounded-xl bg-blue-700 px-4 py-4 text-lg font-semibold text-white shadow-md hover:bg-blue-600">
            Export Video
          </button>
          <nav className="space-y-2 text-lg text-slate-500 dark:text-slate-300">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-white dark:hover:bg-slate-800"><Folder size={20} />Library</button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-white dark:hover:bg-slate-800"><FileText size={20} />Drafts</button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-white dark:hover:bg-slate-800"><Archive size={20} />Archive</button>
            <button className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-3 font-semibold text-blue-700 shadow-sm dark:bg-slate-800"><Sparkles size={20} />Editor</button>
          </nav>
          <button className="absolute bottom-6 left-5 flex items-center gap-2 text-lg text-slate-500 dark:text-slate-300"><Settings size={19} />Settings</button>
        </aside>

        <main className="p-6">
          <section className="mx-auto max-w-4xl rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-950">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="h-full w-full object-contain"
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration
                    setVideoDuration(duration)
                    setTrimStart(0)
                    setTrimEnd(duration)
                    setSplitPoint(duration / 2)
                  }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget
                    const now = video.currentTime
                    setCurrentTime(now)
                    if (activeClip) {
                      const orderedSegments = getOrderedSegments(activeClip)
                      if (!orderedSegments.length) return

                      const epsilon = 0.03
                      const activeIndex = orderedSegments.findIndex(
                        (segment) => now >= segment.start - epsilon && now <= segment.end + epsilon,
                      )

                      if (activeIndex >= 0) {
                        const activeSegment = orderedSegments[activeIndex]
                        if (now >= activeSegment.end - epsilon) {
                          const nextSegment = orderedSegments[activeIndex + 1]
                          if (nextSegment) {
                            video.currentTime = nextSegment.start
                            void video.play()
                          } else {
                            resetClipPlayback(video, activeClip)
                          }
                        }
                        return
                      }

                      const nextSegment = orderedSegments.find((segment) => now < segment.start - epsilon)
                      if (nextSegment) {
                        video.currentTime = nextSegment.start
                        void video.play()
                        return
                      }

                      resetClipPlayback(video, activeClip)
                    }
                  }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <p className="text-sm text-slate-500">Upload a video to start editing.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                  >
                    <Upload size={16} /> Upload Video
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/80">
              <button
                type="button"
                onClick={() => setEditorMode('trim')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${editorMode === 'trim' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                Trim
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('split')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${editorMode === 'split' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('merge')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${editorMode === 'merge' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
              >
                Merge
              </button>
            </div>

            {editorMode === 'trim' && (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Selection timeline</p>
                <div className="relative h-10 rounded-lg bg-slate-200 dark:bg-slate-800">
                  {videoDuration > 0 && (
                    <>
                      <div
                        className="absolute top-0 h-full rounded-lg bg-blue-500/70"
                        style={{
                          left: `${trimStartPercent}%`,
                          width: `${Math.max(0, trimEndPercent - trimStartPercent)}%`,
                        }}
                      />
                      <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
                        <div className="absolute top-0 h-full w-[2px] bg-blue-900" style={{ left: `${trimStartPercent}%` }} />
                        <div className="absolute top-0 h-full w-[2px] bg-blue-900" style={{ left: `${trimEndPercent}%` }} />
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Left playhead ({formatTime(trimStart)})</span>
                    <span>Right playhead ({formatTime(trimEnd)})</span>
                  </div>
                  <div className="relative h-8">
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 0}
                      step={0.1}
                      value={trimStart}
                      disabled={!videoDuration}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setTrimStart(Math.min(value, trimEnd - 0.1))
                      }}
                      className="absolute left-0 top-0 h-8 w-full"
                    />
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 0}
                      step={0.1}
                      value={trimEnd}
                      disabled={!videoDuration}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setTrimEnd(Math.max(value, trimStart + 0.1))
                      }}
                      className="absolute left-0 top-0 h-8 w-full"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Trim range: <span className="font-semibold">{formatTime(trimStart)}</span> - <span className="font-semibold">{formatTime(trimEnd)}</span> ({Math.max(0, trimEnd - trimStart).toFixed(1)}s)
                  </div>
                  <button
                    type="button"
                    onClick={handleTrim}
                    disabled={!videoUrl || trimEnd - trimStart < 0.2}
                    aria-label="Trim selected range"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <Scissors size={16} aria-hidden="true" />
                    <span>Trim</span>
                  </button>
                </div>
              </div>
            )}

            {editorMode === 'split' && (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Split point: <span className="font-semibold">{formatTime(splitPoint)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSplit}
                    disabled={!videoUrl || splitPoint <= 0 || splitPoint >= videoDuration}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Split Video
                  </button>
                </div>
                <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Split timeline</p>
                <div className="relative h-10 rounded-lg bg-slate-200 dark:bg-slate-800">
                  {videoDuration > 0 && (
                    <div
                      className="absolute top-0 h-full w-[3px] bg-blue-900"
                      style={{ left: `${(splitPoint / videoDuration) * 100}%` }}
                    />
                  )}
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-600 dark:text-slate-300">Split playhead ({formatTime(splitPoint)})</label>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 0}
                    step={0.1}
                    value={splitPoint}
                    disabled={!videoDuration}
                    onChange={(event) => {
                      setSplitPoint(Number(event.target.value))
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {editorMode === 'merge' && (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                <p className="mb-3 text-xs font-medium">Select 2 or more clips from the edited timeline below, then merge them.</p>
                <button
                  type="button"
                  onClick={handleMergeSelected}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Merge Clips
                </button>
                {mergeWarning && (
                  <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-300">{mergeWarning}</p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="mb-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Edited timeline preview (trim + split + merge)</p>
              {trimmedClips.length === 0 ? (
                <p className="text-xs text-slate-500">No trimmed clips yet. Select range with two playheads and click Trim.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trimmedClips.map((clip, index) => (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => {
                        if (editorMode === 'merge') {
                          setMergeSelection((prev) =>
                            prev.includes(clip.id)
                              ? prev.filter((id) => id !== clip.id)
                              : [...prev, clip.id],
                          )
                          return
                        }
                        seekToClip(clip)
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                        mergeSelection.includes(clip.id)
                          ? 'border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                          : activeClipId === clip.id
                            ? 'border-blue-700 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      {clip.type === 'trim' ? 'Trim' : clip.type === 'split' ? 'Split' : 'Merge'} Clip {index + 1}:{' '}
                      {clip.segments.map((segment) => `${formatTime(segment.start)}-${formatTime(segment.end)}`).join(' | ')}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">Playhead: {formatTime(currentTime)}</p>
            </div>
          </section>
        </main>

        <aside className="border-l border-slate-300/80 bg-slate-100/80 p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-2xl font-bold text-slate-700 dark:text-slate-100">✦ AI Assistant</h2>
          <div className="space-y-3 text-[28px]">
            <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <p className="mb-2 text-sm font-semibold text-blue-700">Vid Bot</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">How can I help you compose your research video today?</p>
            </div>
            <div className="rounded-xl bg-slate-200 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Trim out the first 10 seconds of the intro clip.</div>
            <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <p className="mb-2 text-sm font-semibold text-blue-700">Vid Bot</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">Processing trim command... removed 00:00 - 00:10.</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-8 text-sm text-slate-400">Ask AI to edit...</p>
            <button className="ml-auto flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 text-white"><Send size={16} /></button>
          </div>
          <button className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Upload Subtitles</button>
          <div className="mt-10 flex items-center justify-between rounded-xl bg-white p-3 dark:bg-slate-800">
            <Search size={16} className="text-slate-500" />
            <div className="h-1 w-24 rounded bg-slate-300 dark:bg-slate-600" />
            <Search size={16} className="text-slate-500" />
            <RotateCcw size={16} className="text-slate-500" />
          </div>
        </aside>
      </div>
    </div>
  )
}
