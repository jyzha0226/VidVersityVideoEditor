/**
 * @file Home.tsx
 * @description Main landing page showing the editor layout with preview, timeline, AI panel, and subtitle tools.
 */

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react'
import AISidebar from '../components/editor/AISidebar'
import { TimelinePanel } from '../components/timeline/TimelinePanel'
import { useTheme } from '../theme/ThemeProvider'
import type {
  SubtitleGenerationOptions,
  SubtitleSegment,
} from '../subtitles/types'
import { SubtitleManager } from '../components/subtitles/SubtitleManager'
import { generateSubtitlesFromVideo } from '../subtitles/api'
import {
  buildVttFromSubtitles,
  downloadSubtitleFile,
} from '../subtitles/export'

export interface VideoPreviewHandle {
  seekTo: (timeInSeconds: number) => void
  getCurrentTime: () => number
}

interface VideoPreviewPanelProps {
  onLoadedMetadata: (durationInSeconds: number) => void
  onTimeUpdate: (timeInSeconds: number) => void
  onVideoSelected: (file: File | null) => void
  subtitles: SubtitleSegment[]
}

const VideoPreviewPanel = forwardRef<VideoPreviewHandle, VideoPreviewPanelProps>(
  function VideoPreviewPanelInner(
    { onLoadedMetadata, onTimeUpdate, onVideoSelected, subtitles },
    ref,
  ): JSX.Element {
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const subtitleTrackUrlRef = useRef<string | null>(null)
    const [hasActiveSubtitles, setHasActiveSubtitles] = useState(false)

    useEffect(() => {
      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl)
        }
        if (subtitleTrackUrlRef.current) {
          URL.revokeObjectURL(subtitleTrackUrlRef.current)
          subtitleTrackUrlRef.current = null
        }
      }
    }, [videoUrl])

    useEffect(() => {
      if (!subtitles || subtitles.length === 0) {
        if (subtitleTrackUrlRef.current) {
          URL.revokeObjectURL(subtitleTrackUrlRef.current)
          subtitleTrackUrlRef.current = null
        }
        setHasActiveSubtitles(false)
        return
      }

      const vttText = buildVttFromSubtitles(subtitles)
      const blob = new Blob([vttText], { type: 'text/vtt' })
      const url = URL.createObjectURL(blob)

      if (subtitleTrackUrlRef.current) {
        URL.revokeObjectURL(subtitleTrackUrlRef.current)
      }
      subtitleTrackUrlRef.current = url
      setHasActiveSubtitles(true)

      return () => {
        if (subtitleTrackUrlRef.current) {
          URL.revokeObjectURL(subtitleTrackUrlRef.current)
          subtitleTrackUrlRef.current = null
        }
      }
    }, [subtitles])

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (timeInSeconds: number) => {
          if (videoRef.current) {
            const safeTime = Math.max(0, timeInSeconds)
            videoRef.current.currentTime = safeTime
            videoRef.current.pause()
            setIsPlaying(false)
          }
        },
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      }),
      [],
    )

    const handleFileChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ): void => {
      const file = event.target.files?.[0]
      if (!file) return

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }

      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setIsPlaying(false)
      onLoadedMetadata(0)
      onTimeUpdate(0)
      onVideoSelected(file)
    }

    const handleUploadClick = (): void => {
      fileInputRef.current?.click()
    }

    const handlePrimaryAction = (): void => {
      if (!videoUrl) {
        handleUploadClick()
        return
      }

      if (videoRef.current) {
        void videoRef.current.play()
        setIsPlaying(true)
      }
    }

    const handleStop = (): void => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setIsPlaying(false)
      }
    }

    return (
      <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Preview
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upload a video to start editing. Generated subtitles are rendered
              back into the player as a live WebVTT track.
            </p>
          </div>
        </header>

        <div className="relative mb-4 flex aspect-video w-full max-h-[360px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full bg-black object-contain"
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(event) => {
                const duration = event.currentTarget.duration
                if (!Number.isNaN(duration)) {
                  onLoadedMetadata(duration)
                }
              }}
              onTimeUpdate={(event) => {
                onTimeUpdate(event.currentTarget.currentTime)
              }}
              controls
              playsInline
            >
              {hasActiveSubtitles && subtitleTrackUrlRef.current ? (
                <track
                  key={subtitleTrackUrlRef.current}
                  label="Subtitles"
                  kind="subtitles"
                  srcLang="en"
                  src={subtitleTrackUrlRef.current}
                  default
                />
              ) : null}
            </video>
          ) : (
            <>
              <img
                src="https://pub-cdn.sider.ai/u/U0JJH468K34/web-coder/69ad2baefd11fbc8fc925288/resource/a8c3bd15-4eff-4d77-8997-bd883021229b.jpg"
                className="h-full w-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/60 to-slate-100 dark:from-slate-950/70 dark:via-slate-950/40 dark:to-slate-950/90" />
              <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm transition-colors hover:bg-sky-500"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs text-slate-50">
                    Play
                  </span>
                  Upload and play video
                </button>
                <p className="max-w-xs text-xs text-slate-700 dark:text-slate-200">
                  Choose a local file (MP4, MOV, and similar). The subtitle
                  generator uses the same file for local Faster-Whisper
                  processing.
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleStop}
            disabled={!videoUrl || !isPlaying}
            className="rounded-md bg-slate-100 px-3 py-1 text-slate-800 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={handleUploadClick}
            className="rounded-md bg-sky-600 px-3 py-1 text-slate-50 transition-colors hover:bg-sky-500"
          >
            Upload video
          </button>
          {videoUrl ? (
            <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
              Tip: Generate subtitles below, then scrub here to review each cue.
            </span>
          ) : null}
        </div>
      </section>
    )
  },
)

export default function HomePage(): JSX.Element {
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [subtitleSegments, setSubtitleSegments] = useState<SubtitleSegment[]>([])
  const [subtitleStatus, setSubtitleStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle')
  const [subtitleError, setSubtitleError] = useState<string | null>(null)

  const videoPreviewRef = useRef<VideoPreviewHandle | null>(null)
  const { theme, toggleTheme } = useTheme()

  const handlePreviewAt = (timeInSeconds: number): void => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.seekTo(timeInSeconds)
      setCurrentTime(timeInSeconds)
    }
  }

  const handleTimelineSeek = (timeInSeconds: number): void => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.seekTo(timeInSeconds)
    }
    setCurrentTime(timeInSeconds)
  }

  const handleGenerateAutoSubtitles = async (
    options: SubtitleGenerationOptions,
  ): Promise<void> => {
    if (!selectedVideoFile) {
      return
    }

    setSubtitleStatus('processing')
    setSubtitleError(null)

    try {
      const generated = await generateSubtitlesFromVideo(selectedVideoFile, options)
      setSubtitleSegments(generated)
      setSubtitleStatus('success')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Subtitle generation failed unexpectedly.'
      setSubtitleStatus('error')
      setSubtitleError(message)
    }
  }

  const handleUpdateSubtitle = (updated: SubtitleSegment): void => {
    setSubtitleSegments((prev) =>
      prev.map((segment) => (segment.id === updated.id ? updated : segment)),
    )
  }

  const handleDeleteSubtitle = (id: string): void => {
    setSubtitleSegments((prev) => prev.filter((segment) => segment.id !== id))
  }

  const handleExportSrt = (): void => {
    if (subtitleSegments.length === 0) {
      return
    }

    const baseName = selectedVideoFile?.name || 'vidversity-subtitles'
    downloadSubtitleFile(subtitleSegments, baseName, 'srt')
  }

  const handleExportVtt = (): void => {
    if (subtitleSegments.length === 0) {
      return
    }

    const baseName = selectedVideoFile?.name || 'vidversity-subtitles'
    downloadSubtitleFile(subtitleSegments, baseName, 'vtt')
  }

  const hasVideo = videoDuration != null && videoDuration > 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:px-6 dark:border-slate-900 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              VidVersity Editor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test Page by swinburne student
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 md:inline dark:text-emerald-300">
              Main workspace
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-amber-300" />
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <VideoPreviewPanel
            ref={videoPreviewRef}
            onLoadedMetadata={(duration) => {
              setVideoDuration(duration > 0 ? duration : null)
              if (duration > 0) {
                setSubtitleError(null)
              }
            }}
            onTimeUpdate={(time) => {
              setCurrentTime(time)
            }}
            onVideoSelected={(file) => {
              setSelectedVideoFile(file)
              setSubtitleSegments([])
              setSubtitleStatus('idle')
              setSubtitleError(null)
            }}
            subtitles={subtitleSegments}
          />

          <div className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(260px,320px)]">
            <TimelinePanel
              duration={videoDuration}
              currentTime={currentTime}
              onSeek={handleTimelineSeek}
            />
            <AISidebar onPreviewAt={handlePreviewAt} />
          </div>

          <SubtitleManager
            segments={subtitleSegments}
            status={subtitleStatus}
            hasVideo={hasVideo}
            errorMessage={subtitleError}
            canExport={subtitleSegments.length > 0}
            onGenerateAuto={handleGenerateAutoSubtitles}
            onExportSrt={handleExportSrt}
            onExportVtt={handleExportVtt}
            onUpdateSegment={handleUpdateSubtitle}
            onDeleteSegment={handleDeleteSubtitle}
            onSeekTo={handleTimelineSeek}
          />
        </div>
      </main>
    </div>
  )
}
