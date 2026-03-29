import React, { useMemo, useRef, useState } from 'react'
import {
  Bot,
  Folder,
  LayoutGrid,
  Scissors,
  Search,
  Settings,
  Upload,
} from 'lucide-react'

interface TrimmedClip {
  id: string
  start: number
  end: number
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'
  const total = Math.floor(seconds)
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export default function HomePage(): JSX.Element {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [trimStart, setTrimStart] = useState<number>(0)
  const [trimEnd, setTrimEnd] = useState<number>(0)
  const [trimmedClips, setTrimmedClips] = useState<TrimmedClip[]>([])

  const inputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const hasVideo = Boolean(videoUrl && videoDuration > 0)

  const activeSelectionWidth = useMemo(() => {
    if (!videoDuration || trimEnd <= trimStart) return 0
    return ((trimEnd - trimStart) / videoDuration) * 100
  }, [trimStart, trimEnd, videoDuration])

  const activeSelectionLeft = useMemo(() => {
    if (!videoDuration) return 0
    return (trimStart / videoDuration) * 100
  }, [trimStart, videoDuration])

  const currentTimePercent = useMemo(() => {
    if (!videoDuration) return 0
    return (currentTime / videoDuration) * 100
  }, [currentTime, videoDuration])

  const handleUploadClick = (): void => {
    inputRef.current?.click()
  }

  const handleUploadVideo = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }

    const objectUrl = URL.createObjectURL(file)
    setVideoUrl(objectUrl)
    setCurrentTime(0)
    setTrimmedClips([])
  }

  const handleTrimAction = (): void => {
    if (!hasVideo) return

    const minClipLength = 0.1
    const safeStart = clamp(trimStart, 0, Math.max(0, videoDuration - minClipLength))
    const safeEnd = clamp(trimEnd, safeStart + minClipLength, videoDuration)

    setTrimmedClips((prev) => [
      ...prev,
      {
        id: `trim-${Date.now()}`,
        start: safeStart,
        end: safeEnd,
      },
    ])

    if (videoRef.current) {
      videoRef.current.currentTime = safeStart
      void videoRef.current.play()
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f7] text-[#0f172a]">
      <header className="flex h-10 items-center justify-between bg-[#d929a6] px-4 text-white shadow-sm">
        <span className="text-lg font-semibold">Vidversity</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold tracking-wide">
          GUIDED MODE
        </span>
      </header>

      <div className="grid min-h-[calc(100vh-40px)] grid-cols-[150px_minmax(0,1fr)_280px]">
        <aside className="border-r border-slate-200 bg-[#f5f6f9] p-3 text-xs text-slate-500">
          <button className="mb-5 w-full rounded-md bg-[#1e5ddf] px-3 py-2 text-[13px] font-semibold text-white shadow">
            Export Video
          </button>

          <nav className="space-y-1">
            {[
              ['Library', Folder],
              ['Drafts', LayoutGrid],
              ['Archive', Folder],
              ['Editor', Scissors],
            ].map(([label, Icon]) => (
              <button
                key={label}
                className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left ${
                  label === 'Editor'
                    ? 'bg-white font-semibold text-[#1e5ddf]'
                    : 'hover:bg-white/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button className="mt-auto flex items-center gap-2 rounded px-2 py-2 text-left hover:bg-white/60">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </aside>

        <main className="flex flex-col gap-3 p-4">
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black/90">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className="h-full w-full"
                  src={videoUrl}
                  controls
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration
                    setVideoDuration(duration)
                    setTrimStart(0)
                    setTrimEnd(duration)
                  }}
                  onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-200"
                >
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Upload a video to start editing</span>
                </button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={handleUploadVideo}
              className="hidden"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTrimAction}
                aria-label="Trim selected range"
                disabled={!hasVideo}
                className="inline-flex items-center gap-2 rounded-md bg-[#1e5ddf] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Trim</span>
              </button>
              <button
                type="button"
                onClick={handleUploadClick}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                Upload video
              </button>
              <span className="ml-auto text-[11px] text-slate-500">
                Selection: {formatTime(trimStart)} - {formatTime(trimEnd)}
              </span>
            </div>

            <div className="relative rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="relative mb-3 h-8 rounded bg-slate-200">
                {hasVideo && (
                  <>
                    <div
                      className="absolute top-0 h-full rounded bg-[#1e5ddf]/30"
                      style={{ left: `${activeSelectionLeft}%`, width: `${activeSelectionWidth}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-[2px] bg-[#1e5ddf]"
                      style={{ left: `${currentTimePercent}%` }}
                    />
                  </>
                )}
              </div>

              <div className="relative h-10">
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 1}
                  step={0.1}
                  value={trimStart}
                  disabled={!hasVideo}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    setTrimStart(clamp(next, 0, Math.max(0, trimEnd - 0.1)))
                  }}
                  className="absolute top-0 h-10 w-full cursor-pointer appearance-none bg-transparent"
                />
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 1}
                  step={0.1}
                  value={trimEnd}
                  disabled={!hasVideo}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    setTrimEnd(clamp(next, trimStart + 0.1, videoDuration || 1))
                  }}
                  className="absolute top-0 h-10 w-full cursor-pointer appearance-none bg-transparent"
                />
              </div>

              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>00:00</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Bottom timeline preview
              </p>
              <div className="relative h-16 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                <div className="absolute left-0 top-0 h-full w-full border-b border-dashed border-slate-300" />

                {trimmedClips.map((clip) => {
                  const left = videoDuration ? (clip.start / videoDuration) * 100 : 0
                  const width = videoDuration
                    ? ((clip.end - clip.start) / videoDuration) * 100
                    : 0

                  return (
                    <div
                      key={clip.id}
                      className="absolute top-4 h-8 rounded border border-[#1e5ddf] bg-[#1e5ddf]/20 px-2 text-[10px] font-semibold text-[#1748ad]"
                      style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                    >
                      {formatTime(clip.start)} - {formatTime(clip.end)}
                    </div>
                  )
                })}

                <div
                  className="absolute top-0 h-full w-[2px] bg-[#1e5ddf]"
                  style={{ left: `${currentTimePercent}%` }}
                />
              </div>
            </div>
          </section>
        </main>

        <aside className="border-l border-slate-200 bg-[#f5f6f9] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Bot className="h-4 w-4 text-[#1e5ddf]" />
            AI ASSISTANT
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="mb-1 font-semibold text-[#1e5ddf]">Vid Bot</p>
              <p className="text-slate-600">
                How can I help compose your research video today?
              </p>
            </div>
            <div className="rounded-md bg-[#e8edf6] p-3 text-slate-700 shadow-sm">
              Trim out the first 10 seconds of the intro clip.
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="mb-1 font-semibold text-[#1e5ddf]">Vid Bot</p>
              <p className="text-slate-600">Processing trim command…</p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-white p-2">
            <input
              type="text"
              placeholder="Ask AI to edit..."
              className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none"
            />
            <button className="mt-2 inline-flex items-center gap-1 rounded bg-[#1e5ddf] px-2 py-1 text-[11px] font-medium text-white">
              <Search className="h-3 w-3" />
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
