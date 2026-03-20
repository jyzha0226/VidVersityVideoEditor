/**
 * @file Home.tsx
 * @description Main landing page showing a VidVersity-style editor layout:
 * top video preview, bottom-left editing tools, bottom-right AI suggestions panel,
 * and a subtitles management panel with mocked transcription and WebVTT injection.
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
import type { SubtitleSegment } from '../subtitles/types'
import { SubtitleManager } from '../components/subtitles/SubtitleManager'

/**
 * @description Public methods exposed by the video preview panel to control playback.
 */
export interface VideoPreviewHandle {
  /**
   * @description Seek video to a specific time in seconds and pause.
   */
  seekTo: (timeInSeconds: number) => void
  /**
   * @description Get the current playback time in seconds.
   */
  getCurrentTime: () => number
}

/**
 * @description Props for the VideoPreviewPanel component.
 */
interface VideoPreviewPanelProps {
  /**
   * @description Called when video metadata is loaded, provides total duration in seconds.
   */
  onLoadedMetadata: (durationInSeconds: number) => void
  /**
   * @description Called whenever current playback time changes.
   */
  onTimeUpdate: (timeInSeconds: number) => void
  /**
   * @description Subtitles to be rendered as a WebVTT track on the video element.
   */
  subtitles: SubtitleSegment[]
}

/**
 * @description Format a floating-point second value to a WebVTT-compatible timestamp.
 * @param seconds - Time in seconds.
 */
function formatVttTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000))
  const hours = Math.floor(totalMs / 3_600_000)
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000)
  const secs = Math.floor((totalMs % 60_000) / 1_000)
  const ms = totalMs % 1_000
  const pad = (n: number, size: number) => n.toString().padStart(size, '0')
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`
}

/**
 * @description Build a minimal WebVTT file content from a list of subtitle segments.
 * @param segments - Subtitle segments to convert.
 */
function buildVttFromSubtitles(segments: SubtitleSegment[]): string {
  const header = 'WEBVTT\n\n'
  const body = segments
    .map((segment, index) => {
      const start = formatVttTime(segment.start)
      const end = formatVttTime(segment.end)
      const text = segment.text && segment.text.trim().length > 0 ? segment.text : '...'
      return `${index + 1}\n${start} --> ${end}\n${text}\n`
    })
    .join('\n')
  return header + body
}

/**
 * @description Video preview panel with upload and basic playback controls.
 * Exposes an imperative handle so parent components can seek programmatically.
 * Also accepts subtitles and injects them as a WebVTT track into the video element.
 */
const VideoPreviewPanel = forwardRef<VideoPreviewHandle, VideoPreviewPanelProps>(
  function VideoPreviewPanelInner(
    { onLoadedMetadata, onTimeUpdate, subtitles }: VideoPreviewPanelProps,
    ref,
  ): JSX.Element {
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const subtitleTrackUrlRef = useRef<string | null>(null)
    const [hasActiveSubtitles, setHasActiveSubtitles] = useState(false)

    /**
     * @description Cleanup previously created object URLs to avoid memory leaks.
     */
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

    /**
     * @description Rebuild WebVTT subtitle track whenever subtitles change.
     */
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

    /**
     * @description Expose playhead control methods to parent component.
     */
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
        getCurrentTime: () => {
          return videoRef.current?.currentTime ?? 0
        },
      }),
      [],
    )

    /**
     * @description Handle selection of a local video file.
     * @param event - Change event from the hidden file input.
     */
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
    }

    /**
     * @description Trigger the native file picker for video upload.
     */
    const handleUploadClick = (): void => {
      fileInputRef.current?.click()
    }

    /**
     * @description Start or resume playback of the loaded video; if none, open upload dialog.
     */
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

    /**
     * @description Pause current video playback and reset to start.
     */
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
              Upload a video to start editing. Use the player controls to scrub
              through. Subtitles (mock) will appear as closed captions.
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
                const time = event.currentTarget.currentTime
                onTimeUpdate(time)
              }}
              controls
              playsInline
            >
              {hasActiveSubtitles && subtitleTrackUrlRef.current && (
                <track
                  key={subtitleTrackUrlRef.current}
                  label="Subtitles"
                  kind="subtitles"
                  srcLang="en"
                  src={subtitleTrackUrlRef.current}
                  default
                />
              )}
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
                  Upload &amp; play video
                </button>
                <p className="max-w-xs text-xs text-slate-700 dark:text-slate-200">
                  Choose a local file (MP4, MOV, etc.). The video stays on your
                  device and plays directly in your browser. Subtitles will be
                  generated via a mocked transcription service.
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
          {videoUrl && (
            <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
              Tip: Use the player controls above to play and scrub. Subtitles
              use the mocked segments below.
            </span>
          )}
        </div>
      </section>
    )
  },
)

/**
 * @description Home page container rendering the editor shell with a top preview and bottom split layout.
 * Wires the real video state into the timeline, AI sidebar, and the subtitles manager.
 */
export default function HomePage(): JSX.Element {
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [subtitleSegments, setSubtitleSegments] = useState<SubtitleSegment[]>([])
  const [subtitleStatus, setSubtitleStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle')

  const videoPreviewRef = useRef<VideoPreviewHandle | null>(null)

  const { theme, toggleTheme } = useTheme()

  /**
   * @description Handle preview request from the AI sidebar by seeking the real video.
   * @param timeInSeconds - Target time to preview in seconds.
   */
  const handlePreviewAt = (timeInSeconds: number): void => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.seekTo(timeInSeconds)
      setCurrentTime(timeInSeconds)
    }
  }

  /**
   * @description Handle seek requests from the timeline panel or subtitles panel.
   * @param timeInSeconds - Target time to move the playhead to.
   */
  const handleTimelineSeek = (timeInSeconds: number): void => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.seekTo(timeInSeconds)
    }
    setCurrentTime(timeInSeconds)
  }

  /**
   * @description Trigger a mocked transcription process to generate subtitle segments.
   * Uses video duration to create evenly spaced example subtitles.
   */
  const handleGenerateMockSubtitles = (): void => {
    if (!videoDuration || videoDuration <= 0) {
      return
    }
    setSubtitleStatus('processing')

    const total = Math.max(videoDuration, 10)
    const roughCount = Math.floor(total / 20)
    const segmentCount = Math.min(6, Math.max(3, roughCount))
    const segmentLength = total / segmentCount

    window.setTimeout(() => {
      const generated: SubtitleSegment[] = []
      for (let index = 0; index < segmentCount; index += 1) {
        const start = index * segmentLength
        const end =
          index === segmentCount - 1 ? total : (index + 1) * segmentLength
        generated.push({
          id: `sub-${index}-${Date.now()}`,
          start,
          end,
          text: `Sample subtitle segment ${index + 1}`,
        })
      }
      setSubtitleSegments(generated)
      setSubtitleStatus('success')
    }, 1200)
  }

  /**
   * @description Update text or timing of a single subtitle segment.
   * @param updated - Updated subtitle object.
   */
  const handleUpdateSubtitle = (updated: SubtitleSegment): void => {
    setSubtitleSegments((prev) =>
      prev.map((segment) => (segment.id === updated.id ? updated : segment)),
    )
  }

  /**
   * @description Delete a subtitle segment from the list.
   * @param id - Identifier of the subtitle to remove.
   */
  const handleDeleteSubtitle = (id: string): void => {
    setSubtitleSegments((prev) => prev.filter((segment) => segment.id !== id))
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
              setVideoDuration(duration)
            }}
            onTimeUpdate={(time) => {
              setCurrentTime(time)
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
            onGenerateMock={handleGenerateMockSubtitles}
            onUpdateSegment={handleUpdateSubtitle}
            onDeleteSegment={handleDeleteSubtitle}
            onSeekTo={handleTimelineSeek}
          />
        </div>
      </main>
    </div>
  )
}
