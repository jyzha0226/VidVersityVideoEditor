import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Bell,
  BookOpen,
  Clapperboard,
  Files,
  FolderArchive,
  HelpCircle,
  Mic,
  Moon,
  Pause,
  Play,
  Plus,
  Scissors,
  Send,
  SkipBack,
  SkipForward,
  Sparkles,
  RotateCcw,
  Save,
  PanelRightClose,
  PanelRightOpen,
  Split,
  Subtitles,
  Sun,
  Trash2,
  Upload,
  Video,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { useTheme } from '../theme/ThemeProvider'
import {
  downloadSubtitleFile,
  buildVttFromSubtitles,
  remapSubtitlesToEditedTimeline,
} from '../subtitles/export'
import {
  appendVideoToEditorSession,
  type AudioActivityDetectionResult,
  createEditorSessionFromVideo,
  detectSilenceFromVideo,
  downloadEditorSessionSourceFile,
  type EditorSessionState,
  exportEditorSessionVideo,
  replaceEditorSessionSegments,
  splitEditorSessionAtTime,
  generateSubtitlesFromVideo,
} from '../subtitles/api'
import { importSubtitlesFromFile } from '../subtitles/import'
import type { SubtitleSegment } from '../subtitles/types'

interface VideoPreviewHandle {
  seekTo: (timeInSeconds: number) => void
  getCurrentTime: () => number
  play: () => void
  pause: () => void
  stepFrame: (direction: -1 | 1) => void
}

interface VideoPreviewPanelProps {
  subtitles: SubtitleSegment[]
  videoUrl?: string | null
  onLoadedMetadata: (durationInSeconds: number) => void
  onTimeUpdate: (timeInSeconds: number) => void
  onPlaybackStateChange: (isPlaying: boolean) => void
  onVideoSourceChange: (videoUrl: string | null) => void
  onVideoFileChange: (file: File | null) => void
}

interface ClipSegment {
  id: number
  label: string
  start: number
  end: number
}

interface AISuggestion {
  id: string
  label: string
  timeRange: string
  description: string
  startTime: number
}

interface TimelineThumbnail {
  id: string
  src: string
  time: number
}

interface EditorHistoryEntry {
  segments: ClipSegment[]
  selectedId: number
  subtitleSegments: SubtitleSegment[]
}

interface AIDraftMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type SubtitleStatus = 'idle' | 'processing' | 'success' | 'error'
type SilenceStatus = 'idle' | 'processing' | 'success' | 'error'
type EditorStatus = 'idle' | 'syncing' | 'ready' | 'error'
type ExportStatus = 'idle' | 'processing' | 'error'
type AppendStatus = 'idle' | 'processing'
type SubtitleTimingField = 'start' | 'end'
type SubtitleEntryStatus = 'idle' | 'uploading' | 'generating' | 'success'
type RightPanelView = 'ai' | 'silence' | 'subtitles' | 'scenes'

interface ToolbarButtonProps {
  label: string
  tooltip: string
  guidedMode: boolean
  isDark: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  danger?: boolean
  tone?: 'editor' | 'workspace' | 'global'
}

const AI_SUGGESTIONS: AISuggestion[] = [
  {
    id: 'scene-1',
    label: 'Scene change',
    timeRange: '00:12 - 00:18',
    description: 'Scene change detected between introduction and slides.',
    startTime: 12,
  },
  {
    id: 'silence-1',
    label: 'Silence segment',
    timeRange: '04:05 - 04:20',
    description: 'Long silence with no speech detected.',
    startTime: 245,
  },
  {
    id: 'transcript-1',
    label: 'Transcript-based',
    timeRange: '15:00 - 15:30',
    description: 'Repeated explanation that may be shortened.',
    startTime: 900,
  },
]

const AI_QUICK_ACTIONS = [
  'Split the video into chapters',
  'Trim the first 10 seconds',
  'Find the cleanest opening sentence',
  'Remove long pauses across the edit',
  'Rewrite subtitles for readability',
]

function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

function formatTransportClock(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toFixed(1)
    .padStart(4, '0')}`
}

function formatEditableTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds - hours * 3600 - minutes * 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toFixed(1).padStart(4, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toFixed(1)
    .padStart(4, '0')}`
}

function parseEditableTimestamp(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parts = trimmed.split(':')
  if (parts.length === 1) {
    const secondsOnly = Number(parts[0])
    return Number.isFinite(secondsOnly) ? Math.max(0, secondsOnly) : null
  }

  if (parts.length === 2) {
    const minutes = Number(parts[0])
    const seconds = Number(parts[1])
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
      return null
    }

    return Math.max(0, minutes * 60 + seconds)
  }

  if (parts.length !== 3) {
    return null
  }

  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  const seconds = Number(parts[2])
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return null
  }

  return Math.max(0, hours * 3600 + minutes * 60 + seconds)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function ToolbarButton({
  label,
  tooltip,
  guidedMode,
  isDark,
  onClick,
  icon: Icon,
  disabled = false,
  danger = false,
  tone = 'editor',
}: ToolbarButtonProps): JSX.Element {
  const styles = danger
    ? isDark
      ? 'text-[#ff8f9a] hover:bg-[#2a1820]'
      : 'text-[#a23535] hover:bg-[#fff1f1]'
    : tone === 'workspace'
      ? isDark
        ? 'text-[#ff7ac8] hover:bg-[#2a1730] hover:text-[#ffb3de]'
        : 'text-[#c2187a] hover:bg-[#fff0f8] hover:text-[#a20f66]'
      : tone === 'global'
        ? isDark
          ? 'text-[#d6deec] hover:bg-[#22314a] hover:text-[#f2f6ff]'
          : 'text-[#5b687c] hover:bg-[#f2f4f6] hover:text-[#37465d]'
        : isDark
          ? 'text-[#8bb8ff] hover:bg-[#182238] hover:text-[#cfe3ff]'
          : 'text-[#003fb1] hover:bg-[#eef3ff] hover:text-[#00308a]'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[8px] font-bold uppercase tracking-[0.18em]">
        {label}
      </span>
      {guidedMode && (
        <div
          className={`pointer-events-none absolute -top-[102px] left-1/2 z-20 hidden w-44 -translate-x-1/2 rounded-2xl border p-3 text-left shadow-xl group-hover:block ${
            isDark
              ? 'border-[#31415a] bg-[#111827]'
              : 'border-[#d4dcff] bg-white'
          }`}
        >
          <p
            className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${
              isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
            }`}
          >
            Guided Tip
          </p>
          <p
            className={`mt-1 text-[11px] leading-4 ${
              isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'
            }`}
          >
            {tooltip}
          </p>
        </div>
      )}
    </button>
  )
}

async function waitForEvent(
  target: EventTarget,
  eventName: string,
): Promise<Event> {
  return new Promise((resolve) => {
    const handler = (event: Event) => {
      target.removeEventListener(eventName, handler)
      resolve(event)
    }
    target.addEventListener(eventName, handler)
  })
}

async function generateTimelineThumbnails(
  videoUrl: string,
  duration: number,
): Promise<TimelineThumbnail[]> {
  if (!videoUrl || duration <= 0) return []

  const frameCount = clamp(Math.round(duration / 8), 8, 18)
  const captureVideo = document.createElement('video')
  captureVideo.src = videoUrl
  captureVideo.muted = true
  captureVideo.playsInline = true
  captureVideo.crossOrigin = 'anonymous'

  if (captureVideo.readyState < 1) {
    await waitForEvent(captureVideo, 'loadedmetadata')
  }

  const width = 160
  const aspectRatio =
    captureVideo.videoWidth > 0 && captureVideo.videoHeight > 0
      ? captureVideo.videoWidth / captureVideo.videoHeight
      : 16 / 9
  const height = Math.max(90, Math.round(width / aspectRatio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return []

  const frames: TimelineThumbnail[] = []

  for (let index = 0; index < frameCount; index += 1) {
    const time =
      frameCount === 1 ? 0 : (duration * index) / Math.max(frameCount - 1, 1)
    captureVideo.currentTime = clamp(time, 0, Math.max(duration - 0.05, 0))
    await waitForEvent(captureVideo, 'seeked')
    context.drawImage(captureVideo, 0, 0, width, height)
    frames.push({
      id: `thumb-${index}-${time.toFixed(2)}`,
      src: canvas.toDataURL('image/jpeg', 0.72),
      time,
    })
  }

  captureVideo.src = ''
  return frames
}

async function generateWaveformSamples(videoUrl: string): Promise<number[]> {
  if (!videoUrl) return []

  try {
    const response = await fetch(videoUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioContext = new window.AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const channelData = Array.from({ length: audioBuffer.numberOfChannels }, (_, index) =>
      audioBuffer.getChannelData(index),
    )
    const sampleCount = 160
    const blockSize = Math.max(1, Math.floor(audioBuffer.length / sampleCount))
    const filteredData = Array.from({ length: sampleCount }, (_, index) => {
      let peak = 0
      const start = index * blockSize
      const end = Math.min(start + blockSize, audioBuffer.length)
      for (const data of channelData) {
        for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
          peak = Math.max(peak, Math.abs(data[sampleIndex]))
        }
      }
      return peak
    })

    const max = Math.max(...filteredData, 0.001)
    const normalized = filteredData.map((value) => {
      const scaled = Math.sqrt(value / max)
      return clamp(scaled, 0.04, 1)
    })
    await audioContext.close()
    return normalized
  } catch {
    return []
  }
}

const VideoPreviewPanel = forwardRef<VideoPreviewHandle, VideoPreviewPanelProps>(
  function VideoPreviewPanelInner(
    {
      videoUrl: externalVideoUrl,
      subtitles,
      onLoadedMetadata,
      onTimeUpdate,
      onPlaybackStateChange,
      onVideoSourceChange,
      onVideoFileChange,
    }: VideoPreviewPanelProps,
    ref,
  ): JSX.Element {
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const subtitleTrackUrlRef = useRef<string | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl)
        }
        if (subtitleTrackUrlRef.current) {
          URL.revokeObjectURL(subtitleTrackUrlRef.current)
        }
      }
    }, [videoUrl])

    useEffect(() => {
      if (subtitleTrackUrlRef.current) {
        URL.revokeObjectURL(subtitleTrackUrlRef.current)
        subtitleTrackUrlRef.current = null
      }

      if (subtitles.length === 0) {
        return
      }

      const blob = new Blob([buildVttFromSubtitles(subtitles)], {
        type: 'text/vtt',
      })
      subtitleTrackUrlRef.current = URL.createObjectURL(blob)
    }, [subtitles])

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (timeInSeconds: number) => {
          if (!videoRef.current) return
          const nextTime = Math.max(0, timeInSeconds)
          videoRef.current.currentTime = nextTime
          onTimeUpdate(nextTime)
        },
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
        play: () => {
          if (!videoRef.current) return
          void videoRef.current.play()
        },
        pause: () => {
          videoRef.current?.pause()
        },
        stepFrame: (direction: -1 | 1) => {
          if (!videoRef.current) return
          const frameStep = 1 / 30
          const nextTime = Math.max(
            0,
            videoRef.current.currentTime + direction * frameStep,
          )
          videoRef.current.pause()
          videoRef.current.currentTime = nextTime
          onPlaybackStateChange(false)
          onTimeUpdate(nextTime)
        },
      }),
      [onPlaybackStateChange, onTimeUpdate],
    )

    useEffect(() => {
      if (!externalVideoUrl || externalVideoUrl === videoUrl) return

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }

      setVideoUrl(externalVideoUrl)
      onTimeUpdate(0)
      onPlaybackStateChange(false)
      onVideoSourceChange(externalVideoUrl)
    }, [
      externalVideoUrl,
      onPlaybackStateChange,
      onTimeUpdate,
      onVideoSourceChange,
      videoUrl,
    ])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }

      const nextUrl = URL.createObjectURL(file)
      setVideoUrl(nextUrl)
      onTimeUpdate(0)
      onPlaybackStateChange(false)
      onVideoSourceChange(nextUrl)
      onVideoFileChange(file)
    }

    const handleUploadClick = () => {
      fileInputRef.current?.click()
    }

    return (
      <section className="flex flex-1 min-h-0 w-full items-center justify-center px-4 py-4 xl:px-6 xl:py-5">
        <div className="relative w-full max-w-[900px] overflow-hidden rounded-[24px] bg-black shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
          {videoUrl ? (
            <video
              ref={videoRef}
              className="aspect-video max-h-[42vh] w-full bg-black object-contain"
              src={videoUrl}
              playsInline
              onLoadedMetadata={(event) => {
                const nextDuration = event.currentTarget.duration
                event.currentTarget.currentTime = 0
                onTimeUpdate(0)
                onLoadedMetadata(nextDuration)
              }}
              onTimeUpdate={(event) => {
                const nextTime = event.currentTarget.currentTime
                onTimeUpdate(nextTime)
              }}
              onPlay={() => {
                onPlaybackStateChange(true)
              }}
              onPause={() => {
                onPlaybackStateChange(false)
              }}
              onEnded={() => {
                onPlaybackStateChange(false)
              }}
            >
              {subtitleTrackUrlRef.current && (
                <track
                  key={subtitleTrackUrlRef.current}
                  default
                  kind="subtitles"
                  label="Subtitles"
                  src={subtitleTrackUrlRef.current}
                  srcLang="en"
                />
              )}
            </video>
          ) : (
            <button
              type="button"
              onClick={handleUploadClick}
              className="relative aspect-video max-h-[42vh] w-full overflow-hidden bg-black text-left transition hover:bg-[#05070b]"
              aria-label="Upload video"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/18 backdrop-blur-md transition hover:bg-white/24">
                  <Upload className="h-9 w-9 text-white" />
                </span>
                <div className="text-center">
                  <p className="mt-2 text-sm text-white/70">
                    Upload a local video to start editing in this workspace.
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          accept="video/*"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
      </section>
    )
  },
)

function createInitialSegments(duration: number): ClipSegment[] {
  const safeDuration = Math.max(1, duration || 180)
  return [{ id: 1, label: 'Clip 1', start: 0, end: safeDuration }]
}

function makeMockSubtitles(duration: number): SubtitleSegment[] {
  const total = Math.max(24, Math.floor(duration || 120))
  const slices = 4
  const chunk = total / slices

  return Array.from({ length: slices }, (_, index) => {
    const start = index * chunk
    const end = index === slices - 1 ? total : (index + 1) * chunk
    return {
      id: `subtitle-${index}-${Date.now()}`,
      start,
      end,
      text:
        index === 0
          ? 'Welcome to today’s research walkthrough.'
          : index === 1
            ? 'Here we compare footage, evidence, and structure.'
            : index === 2
              ? 'Notice the key process change on the timeline.'
              : 'We end with a concise academic summary.',
    }
  })
}

function createSpeechSegmentsFromDetection(
  speechSegments: Array<{ start: number; end: number }>,
  duration: number,
): ClipSegment[] {
  const normalized =
    speechSegments.length > 0
      ? speechSegments
      : [{ start: 0, end: Math.max(1, duration || 1) }]

  return normalized.map((segment, index) => ({
    id: index + 1,
    label: `Speech clip ${index + 1}`,
    start: segment.start,
    end: segment.end,
  }))
}

function createSilenceSegmentKey(start: number, end: number, index: number): string {
  return `${index}:${start.toFixed(3)}:${end.toFixed(3)}`
}

async function createFileFromVideoUrl(videoUrl: string): Promise<File> {
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error('Could not load the selected draft video into the editor.')
  }

  const blob = await response.blob()
  const contentType = blob.type || 'video/mp4'
  const extension = contentType.split('/')[1] || 'mp4'
  return new File([blob], `draft-video.${extension}`, {
    type: contentType,
  })
}

function getSegmentTimelineFrames(
  thumbnails: TimelineThumbnail[],
  segment: ClipSegment,
): TimelineThumbnail[] {
  if (thumbnails.length === 0) return []

  const frames = thumbnails.filter(
    (thumbnail) =>
      thumbnail.time >= segment.start && thumbnail.time < segment.end,
  )

  if (frames.length > 0) {
    return frames
  }

  const nearest = thumbnails.reduce<TimelineThumbnail | null>((closest, thumbnail) => {
    if (closest == null) return thumbnail

    const thumbnailDistance = Math.min(
      Math.abs(thumbnail.time - segment.start),
      Math.abs(thumbnail.time - segment.end),
    )
    const closestDistance = Math.min(
      Math.abs(closest.time - segment.start),
      Math.abs(closest.time - segment.end),
    )

    return thumbnailDistance < closestDistance ? thumbnail : closest
  }, null)

  return nearest ? [nearest] : []
}

export default function HomePage(): JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const location = useLocation()
  const preloadedVideoUrl =
    (location.state as { preloadedVideoUrl?: string } | null)?.preloadedVideoUrl ??
    null
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [videoSourceUrl, setVideoSourceUrl] = useState<string | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [guidedMode, setGuidedMode] = useState(true)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const [aiPromptDraft, setAiPromptDraft] = useState('')
  const [aiMessages, setAiMessages] = useState<AIDraftMessage[]>([
    {
      id: 'assistant-seed',
      role: 'assistant',
      text: 'AI actions will appear here once the backend is connected. For now, suggestion chips can prefill a request and Send stores it in this workspace panel.',
    },
  ])
  const [subtitleSegments, setSubtitleSegments] = useState<SubtitleSegment[]>([])
  const [subtitleStatus, setSubtitleStatus] = useState<SubtitleStatus>('idle')
  const [subtitleError, setSubtitleError] = useState<string | null>(null)
  const [silenceStatus, setSilenceStatus] = useState<SilenceStatus>('idle')
  const [silenceError, setSilenceError] = useState<string | null>(null)
  const [silenceSegments, setSilenceSegments] = useState<
    AudioActivityDetectionResult['silenceSegments']
  >([])
  const [selectedSilenceSegmentKeys, setSelectedSilenceSegmentKeys] = useState<string[]>(
    [],
  )
  const [stagedSilenceSegmentKeys, setStagedSilenceSegmentKeys] = useState<string[]>([])
  const [silenceNotice, setSilenceNotice] = useState<string | null>(null)
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('ai')
  const [subtitleEntryStatus, setSubtitleEntryStatus] =
    useState<SubtitleEntryStatus>('idle')
  const [subtitleTimingDrafts, setSubtitleTimingDrafts] = useState<
    Record<string, string>
  >({})
  const [sceneStatus, setSceneStatus] = useState<'idle' | 'pending'>('idle')
  const [segments, setSegments] = useState<ClipSegment[]>(createInitialSegments(180))
  const [selectedId, setSelectedId] = useState<number>(1)
  const [editorSessionId, setEditorSessionId] = useState<string | null>(null)
  const [editorStatus, setEditorStatus] = useState<EditorStatus>('idle')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [exportError, setExportError] = useState<string | null>(null)
  const [appendStatus, setAppendStatus] = useState<AppendStatus>('idle')
  const [timelineThumbnails, setTimelineThumbnails] = useState<TimelineThumbnail[]>([])
  const [waveformSamples, setWaveformSamples] = useState<number[]>([])
  const [timelineMediaReady, setTimelineMediaReady] = useState(false)
  const [isTimelineDragging, setIsTimelineDragging] = useState(false)
  const [timelineZoom, setTimelineZoom] = useState(1)
  const [history, setHistory] = useState<EditorHistoryEntry[]>([])

  const videoPreviewRef = useRef<VideoPreviewHandle | null>(null)
  const timelineTrackRef = useRef<HTMLDivElement | null>(null)
  const subtitleUploadInputRef = useRef<HTMLInputElement | null>(null)
  const appendVideoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!videoDuration || videoDuration <= 0) return
    if (editorSessionId) return
    setSegments(createInitialSegments(videoDuration))
    setSelectedId(1)
    setHistory([])
    setEditorError(null)
    setExportStatus('idle')
    setExportError(null)
    setSilenceStatus('idle')
    setSilenceError(null)
    setSilenceSegments([])
    setSelectedSilenceSegmentKeys([])
    setStagedSilenceSegmentKeys([])
    setSilenceNotice(null)
  }, [editorSessionId, videoDuration])

  useEffect(() => {
    if (!preloadedVideoUrl) {
      return
    }

    setSelectedVideoFile(null)
    setEditorSessionId(null)
    setEditorStatus('idle')
    setEditorError(null)
    setExportStatus('idle')
    setExportError(null)
    setSilenceSegments([])
    setSelectedSilenceSegmentKeys([])
    setStagedSilenceSegmentKeys([])
    setSilenceStatus('idle')
    setSilenceError(null)
    setSilenceNotice(null)
  }, [preloadedVideoUrl])

  useEffect(() => {
    let cancelled = false

    if (!videoSourceUrl || !videoDuration || videoDuration <= 0) {
      setTimelineThumbnails([])
      setWaveformSamples([])
      setTimelineMediaReady(false)
      setCurrentTime(0)
      return
    }

    setTimelineMediaReady(false)

    void (async () => {
      const [frames, waveform] = await Promise.all([
        generateTimelineThumbnails(videoSourceUrl, videoDuration),
        generateWaveformSamples(videoSourceUrl),
      ])

      if (cancelled) return
      setTimelineThumbnails(frames)
      setWaveformSamples(waveform)
      setTimelineMediaReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [videoDuration, videoSourceUrl])

  useEffect(() => {
    if (!editorSessionId || segments.length === 0) return

    let cancelled = false

    void (async () => {
      try {
        setEditorStatus('syncing')
        await replaceEditorSessionSegments(editorSessionId, segments, selectedId)
        if (!cancelled) {
          setEditorStatus('ready')
          setEditorError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setEditorStatus('error')
          setEditorError(
            error instanceof Error
              ? error.message
              : 'Could not sync the editor timeline.',
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editorSessionId, segments, selectedId])

  const selectedSegment =
    segments.find((segment) => segment.id === selectedId) ?? segments[0] ?? null
  const selectedIndex = selectedSegment
    ? segments.findIndex((segment) => segment.id === selectedSegment.id)
    : -1
  const canMergeWithNext =
    selectedIndex >= 0 && selectedIndex < segments.length - 1

  const totalDuration =
    videoDuration && videoDuration > 0
      ? videoDuration
      : segments.length > 0
        ? segments[segments.length - 1].end
        : 180
  const editedDuration = Math.max(
    0,
    segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0),
  )

  const silenceReviewItems = silenceSegments.map((segment, index) => ({
    ...segment,
    key: createSilenceSegmentKey(segment.start, segment.end, index),
    index,
  }))
  const selectedSilenceCount = silenceReviewItems.filter((segment) =>
    selectedSilenceSegmentKeys.includes(segment.key),
  ).length
  const stagedSilenceCount = silenceReviewItems.filter((segment) =>
    stagedSilenceSegmentKeys.includes(segment.key),
  ).length
  const hasUnsavedChanges =
    Boolean(selectedVideoFile || videoSourceUrl || preloadedVideoUrl) &&
    (
      history.length > 0 ||
      Boolean(editorSessionId) ||
      subtitleSegments.length > 0 ||
      silenceSegments.length > 0 ||
      stagedSilenceSegmentKeys.length > 0
    )

  const captureEditorState = (): EditorHistoryEntry => ({
    segments: segments.map((segment) => ({ ...segment })),
    selectedId,
    subtitleSegments: subtitleSegments.map((segment) => ({ ...segment })),
  })

  const pushHistory = () => {
    setHistory((prev) => [...prev.slice(-29), captureEditorState()])
  }

  const confirmDiscardChanges = () => {
    if (!hasUnsavedChanges) {
      return true
    }

    return window.confirm(
      'You have unsaved changes in the editor. If you leave now, those changes will be lost.',
    )
  }

  const ensureVideoFile = async (): Promise<File | null> => {
    if (selectedVideoFile) {
      return selectedVideoFile
    }

    const sourceUrl = videoSourceUrl || preloadedVideoUrl
    if (!sourceUrl) {
      return null
    }

    try {
      const file = await createFileFromVideoUrl(sourceUrl)
      setSelectedVideoFile(file)
      return file
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not prepare the selected video for editing.'
      setSubtitleError(message)
      setSilenceError(message)
      setEditorError(message)
      return null
    }
  }

  const resetWorkspaceForNewSource = () => {
    setEditorSessionId(null)
    setEditorStatus('idle')
    setEditorError(null)
    setSubtitleSegments([])
    setSubtitleStatus('idle')
    setSubtitleError(null)
    setSubtitleTimingDrafts({})
    setSilenceStatus('idle')
    setSilenceError(null)
    setSilenceSegments([])
    setSelectedSilenceSegmentKeys([])
    setStagedSilenceSegmentKeys([])
    setSilenceNotice(null)
    setRightPanelView('ai')
    setHistory([])
  }

  const handleUndo = async () => {
    if (history.length === 0) return

    const previous = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setSegments(previous.segments)
    setSelectedId(previous.selectedId)
    setSubtitleSegments(previous.subtitleSegments)

    if (!editorSessionId) return

    try {
      setEditorStatus('syncing')
      const session = await replaceEditorSessionSegments(
        editorSessionId,
        previous.segments,
        previous.selectedId,
      )
      setSegments(session.segments)
      setSelectedId(session.selectedSegmentId ?? previous.selectedId)
      setEditorStatus('ready')
      setEditorError(null)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not restore the previous editor state.',
      )
    }
  }

  const handleSeek = (timeInSeconds: number) => {
    const safeTime = Math.max(0, Math.min(timeInSeconds, totalDuration))
    const containingSegment = segments.find(
      (segment) => safeTime >= segment.start && safeTime <= segment.end,
    )
    if (containingSegment) {
      setSelectedId(containingSegment.id)
    }
    videoPreviewRef.current?.seekTo(safeTime)
    setCurrentTime(safeTime)
  }

  const seekTimelineFromClientX = (clientX: number) => {
    if (!timelineTrackRef.current || totalDuration <= 0) return
    const bounds = timelineTrackRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    handleSeek(ratio * totalDuration)
  }

  const handleTrimIntro = () => {
    if (segments.length === 0) return
    const introClip = segments[0]
    const nextStart = Math.min(introClip.end - 1, 10)
    pushHistory()

    setSegments((prev) =>
      prev.map((segment, index) =>
        index === 0 ? { ...segment, start: nextStart } : segment,
      ),
    )
    setSelectedId(introClip.id)
    handleSeek(nextStart)
  }

  const handleGenerateSubtitles = async (): Promise<boolean> => {
    const videoFile = await ensureVideoFile()
    if (!videoFile) {
      setSubtitleStatus('error')
      setSubtitleError('Upload a local video file before generating subtitles.')
      return false
    }

    pushHistory()
    setSubtitleStatus('processing')
    setSubtitleError(null)

    try {
      const generated = await generateSubtitlesFromVideo(videoFile, {
        model: 'tiny.en',
        language: 'en',
      })
      setSubtitleSegments(generated)
      setSubtitleTimingDrafts({})
      setSubtitleStatus('success')
      setRightPanelView('subtitles')
      setIsRightPanelCollapsed(false)
      return true
    } catch (error) {
      setSubtitleStatus('error')
      setSubtitleError(
        error instanceof Error
          ? error.message
          : 'Subtitle generation failed unexpectedly.',
      )
      return false
    }
  }

  const handleRemoveSilence = async () => {
    setRightPanelView('silence')
    setIsRightPanelCollapsed(false)

    const videoFile = await ensureVideoFile()
    if (!videoFile) {
      setSilenceStatus('error')
      setSilenceError(
        'Upload a local video file before running silence detection.',
      )
      return
    }

    setSilenceStatus('processing')
    setSilenceError(null)
    setSilenceNotice(null)

    try {
      const detection = await detectSilenceFromVideo(videoFile, {
        noiseThresholdDb: -35,
        minSilenceDuration: 0.6,
        minSegmentDuration: 0.25,
      })
      const nextSilenceSegments = detection.silenceSegments
      setSilenceSegments(nextSilenceSegments)
      setSelectedSilenceSegmentKeys(
        nextSilenceSegments.map((segment, index) =>
          createSilenceSegmentKey(segment.start, segment.end, index),
        ),
      )
      setStagedSilenceSegmentKeys([])
      setSilenceStatus('success')
      setSilenceNotice(
        nextSilenceSegments.length > 0
          ? 'Review the detected silence ranges, then stage the ones you want the backend editor to remove later.'
          : 'No long silence ranges were detected in this pass.',
      )
    } catch (error) {
      setSilenceStatus('error')
      setSilenceError(
        error instanceof Error
          ? error.message
          : 'Silence detection failed unexpectedly.',
      )
    }
  }

  const handleOpenAIPanel = () => {
    setRightPanelView('ai')
    setIsRightPanelCollapsed(false)
  }

  const handleOpenSubtitlesPanel = () => {
    setRightPanelView('subtitles')
    setIsRightPanelCollapsed(false)
    setSubtitleError(null)
  }

  const handleOpenScenesPanel = () => {
    setRightPanelView('scenes')
    setIsRightPanelCollapsed(false)
    setSceneStatus('pending')
  }

  const handleToggleSilenceSelection = (key: string) => {
    setSelectedSilenceSegmentKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    )
  }

  const handleSelectAllSilences = () => {
    setSelectedSilenceSegmentKeys(silenceReviewItems.map((segment) => segment.key))
    setSilenceError(null)
  }

  const handleClearSelectedSilences = () => {
    setSelectedSilenceSegmentKeys([])
    setSilenceError(null)
  }

  const handleApplySelectedSilences = () => {
    if (selectedSilenceSegmentKeys.length === 0) {
      setSilenceError(
        'Select at least one silence range to stage it for backend removal.',
      )
      return
    }

    setSilenceError(null)
    setStagedSilenceSegmentKeys([...selectedSilenceSegmentKeys])
    setSilenceNotice(
      `${selectedSilenceSegmentKeys.length} silence range${
        selectedSilenceSegmentKeys.length === 1 ? '' : 's'
      } staged for future backend removal. This does not edit playback or media yet.`,
    )
  }

  const ensureEditorSession = async (): Promise<EditorSessionState | null> => {
    const videoFile = await ensureVideoFile()
    if (!videoFile) {
      setEditorStatus('error')
      setEditorError('Upload a local video file to use real split editing.')
      return null
    }

    if (editorSessionId) {
      return {
        sessionId: editorSessionId,
        duration: videoDuration ?? totalDuration,
        selectedSegmentId: selectedId,
        segments,
      }
    }

    try {
      setEditorStatus('syncing')
      const session = await createEditorSessionFromVideo(videoFile)
      setEditorSessionId(session.sessionId)
      setSegments(session.segments)
      setSelectedId(session.selectedSegmentId ?? session.segments[0]?.id ?? 1)
      setEditorStatus('ready')
      setEditorError(null)
      return session
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not create an editor session for this video.',
      )
      return null
    }
  }

  const handleSplitAtPlayhead = async () => {
    if (!selectedSegment) return
    const playhead = currentTime
    const minGap = 1

    if (
      playhead <= selectedSegment.start + minGap ||
      playhead >= selectedSegment.end - minGap
    ) {
      return
    }

    const session = await ensureEditorSession()
    if (!session) return

    try {
      setEditorStatus('syncing')
      const previousState = captureEditorState()
      const nextSession = await splitEditorSessionAtTime(
        session.sessionId,
        selectedSegment.id,
        playhead,
      )

      setHistory((prev) => [...prev.slice(-29), previousState])
      setSegments(nextSession.segments)
      setSelectedId(
        nextSession.selectedSegmentId ?? nextSession.segments[0]?.id ?? selectedSegment.id,
      )
      setEditorStatus('ready')
      setEditorError(null)
      handleSeek(playhead)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not split the selected clip.',
      )
    }
  }

  const handleTrimStart = () => {
    if (!selectedSegment) return
    const playhead = currentTime
    if (playhead <= selectedSegment.start || playhead >= selectedSegment.end - 1) {
      return
    }
    pushHistory()

    setSegments((prev) =>
      prev.map((segment) =>
        segment.id === selectedSegment.id
          ? { ...segment, start: playhead }
          : segment,
      ),
    )

    handleSeek(playhead)
  }

  const handleTrimEnd = () => {
    if (!selectedSegment) return
    const playhead = currentTime
    if (playhead >= selectedSegment.end || playhead <= selectedSegment.start + 1) {
      return
    }
    pushHistory()

    setSegments((prev) =>
      prev.map((segment) =>
        segment.id === selectedSegment.id ? { ...segment, end: playhead } : segment,
      ),
    )

    handleSeek(playhead)
  }

  const handleMergeWithNext = () => {
    if (!selectedSegment || !canMergeWithNext) return
    pushHistory()

    setSegments((prev) => {
      const index = prev.findIndex((segment) => segment.id === selectedSegment.id)
      if (index < 0 || index >= prev.length - 1) return prev

      const currentSegment = prev[index]
      const nextSegment = prev[index + 1]
      const mergedSegment: ClipSegment = {
        id: Date.now(),
        label: `${currentSegment.label} + ${nextSegment.label}`,
        start: currentSegment.start,
        end: nextSegment.end,
      }

      const copy = [...prev]
      copy.splice(index, 2, mergedSegment)
      setSelectedId(mergedSegment.id)
      return copy
    })

    handleSeek(selectedSegment.start)
  }

  const handleDeleteSelectedClip = () => {
    if (!selectedSegment) return
    pushHistory()

    setSegments((prev) => {
      const index = prev.findIndex((segment) => segment.id === selectedSegment.id)
      const filtered = prev.filter((segment) => segment.id !== selectedSegment.id)
      if (filtered.length === 0) {
        setSelectedId(0)
        return []
      }

      const nextIndex = Math.min(index, filtered.length - 1)
      const nextSegment = filtered[nextIndex]
      setSelectedId(nextSegment.id)
      handleSeek(nextSegment.start)
      return filtered
    })
  }

  const handleUpdateSubtitle = (updated: SubtitleSegment) => {
    pushHistory()
    setSubtitleError(null)
    setSubtitleSegments((prev) =>
      prev.map((segment) => (segment.id === updated.id ? updated : segment)),
    )
  }

  const handleDeleteSubtitle = (id: string) => {
    pushHistory()
    setSubtitleError(null)
    setSubtitleSegments((prev) => prev.filter((segment) => segment.id !== id))
    setSubtitleTimingDrafts((prev) => {
      const next = { ...prev }
      delete next[`${id}:start`]
      delete next[`${id}:end`]
      return next
    })
  }

  const handleUpdateSubtitleTiming = (
    segment: SubtitleSegment,
    field: SubtitleTimingField,
    nextValue: number,
  ) => {
    const normalizedValue = Math.max(0, nextValue)
    const minimumGap = 0.1
    const updatedSegment: SubtitleSegment =
      field === 'start'
        ? {
            ...segment,
            start: Math.min(normalizedValue, Math.max(0, segment.end - minimumGap)),
          }
        : {
            ...segment,
            end: Math.max(normalizedValue, segment.start + minimumGap),
          }

    handleUpdateSubtitle(updatedSegment)
  }

  const getSubtitleTimingDraft = (
    segment: SubtitleSegment,
    field: SubtitleTimingField,
  ): string =>
    subtitleTimingDrafts[`${segment.id}:${field}`] ??
    formatEditableTimestamp(segment[field])

  const handleSubtitleTimingDraftChange = (
    segmentId: string,
    field: SubtitleTimingField,
    value: string,
  ) => {
    setSubtitleTimingDrafts((prev) => ({
      ...prev,
      [`${segmentId}:${field}`]: value,
    }))
  }

  const handleSubtitleTimingDraftCommit = (
    segment: SubtitleSegment,
    field: SubtitleTimingField,
  ) => {
    const key = `${segment.id}:${field}`
    const draft = subtitleTimingDrafts[key]
    const parsed = parseEditableTimestamp(draft ?? formatEditableTimestamp(segment[field]))

    if (parsed == null) {
      setSubtitleError(
        'Use subtitle times in mm:ss.s or hh:mm:ss.s format, for example 01:23.4 or 01:02:03.4.',
      )
      setSubtitleTimingDrafts((prev) => ({
        ...prev,
        [key]: formatEditableTimestamp(segment[field]),
      }))
      return
    }

    setSubtitleError(null)
    handleUpdateSubtitleTiming(segment, field, parsed)
    setSubtitleTimingDrafts((prev) => ({
      ...prev,
      [key]: formatEditableTimestamp(
        field === 'start'
          ? Math.min(parsed, Math.max(0, segment.end - 0.1))
          : Math.max(parsed, segment.start + 0.1),
      ),
    }))
  }

  const handleExportSubtitle = (format: 'srt' | 'vtt') => {
    if (subtitleSegments.length === 0) return

    const baseName = selectedVideoFile?.name || 'vidversity-subtitles'
    downloadSubtitleFile(subtitleSegments, baseName, format)
  }

  const handleRemoveSubtitles = () => {
    pushHistory()
    setSubtitleSegments([])
    setSubtitleStatus('idle')
    setSubtitleError(null)
    setSubtitleTimingDrafts({})
    setSubtitleEntryStatus('idle')
  }

  const handleGenerateSubtitlesFromPanel = async () => {
    setSubtitleEntryStatus('generating')
    const didSucceed = await handleGenerateSubtitles()
    if (didSucceed) {
      setSubtitleEntryStatus('success')
      window.setTimeout(() => {
        setSubtitleEntryStatus('idle')
      }, 700)
    } else {
      setSubtitleEntryStatus('idle')
    }
  }

  const handleExportVideo = async () => {
    const session = await ensureEditorSession()
    if (!session) return

    try {
      setExportStatus('processing')
      setExportError(null)

      await replaceEditorSessionSegments(session.sessionId, segments, selectedId)

      const rendered = await exportEditorSessionVideo(session.sessionId)
      const url = URL.createObjectURL(rendered.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = rendered.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (subtitleSegments.length > 0) {
        const remappedSubtitles = remapSubtitlesToEditedTimeline(
          subtitleSegments,
          segments,
        )
        if (remappedSubtitles.length > 0) {
          const baseName = rendered.fileName.replace(/\.mp4$/i, '')
          downloadSubtitleFile(remappedSubtitles, baseName, 'srt')
        }
      }

      setExportStatus('idle')
    } catch (error) {
      setExportStatus('error')
      setExportError(
        error instanceof Error
          ? error.message
          : 'Could not export the edited video.',
      )
    }
  }

  const handleSubtitleUploadClick = () => {
    subtitleUploadInputRef.current?.click()
  }

  const handleAppendVideoClick = () => {
    appendVideoInputRef.current?.click()
  }

  const handleAppendVideoSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const session = await ensureEditorSession()
    if (!session) return

    try {
      setAppendStatus('processing')
      setEditorStatus('syncing')
      setEditorError(null)
      const nextSession = await appendVideoToEditorSession(session.sessionId, file)
      const combinedFile = await downloadEditorSessionSourceFile(nextSession.sessionId)
      const combinedUrl = URL.createObjectURL(combinedFile)

      setSelectedVideoFile(combinedFile)
      setVideoSourceUrl(combinedUrl)
      setVideoDuration(nextSession.duration)
      setCurrentTime(0)
      setSegments(nextSession.segments)
      setSelectedId(
        nextSession.selectedSegmentId ?? nextSession.segments.at(-1)?.id ?? selectedId,
      )
      setEditorSessionId(nextSession.sessionId)
      setEditorStatus('ready')
      setIsPlaying(false)
      setHistory([])
      setSubtitleSegments([])
      setSubtitleStatus('idle')
      setSubtitleError(null)
      setSubtitleTimingDrafts({})
      setSilenceStatus('idle')
      setSilenceError(null)
      setSilenceSegments([])
      setSelectedSilenceSegmentKeys([])
      setStagedSilenceSegmentKeys([])
      setSilenceNotice(
        `${file.name} was added to the end of the current timeline. Regenerate subtitles or silence detection if you want those tools to include the new clip.`,
      )
      setRightPanelView('ai')
      videoPreviewRef.current?.pause()
      videoPreviewRef.current?.seekTo(0)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not add the uploaded video to the current timeline.',
      )
    } finally {
      setAppendStatus('idle')
    }
  }

  const handleSubtitleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setSubtitleEntryStatus('uploading')
    setSubtitleError(null)

    try {
      const importedSegments = await importSubtitlesFromFile(file)
      pushHistory()
      setSubtitleSegments(importedSegments)
      setSubtitleStatus('success')
      setSubtitleTimingDrafts({})
      setSubtitleEntryStatus('success')
      setRightPanelView('subtitles')
      setIsRightPanelCollapsed(false)
      window.setTimeout(() => {
        setSubtitleEntryStatus('idle')
      }, 700)
    } catch (error) {
      setSubtitleStatus('error')
      setSubtitleEntryStatus('idle')
      setSubtitleError(
        error instanceof Error
          ? error.message
          : 'Subtitle upload failed unexpectedly.',
      )
    }
  }

  const handlePreviewSuggestion = (suggestionId: string) => {
    const suggestion = AI_SUGGESTIONS.find((item) => item.id === suggestionId)
    if (!suggestion) return
    handleSeek(suggestion.startTime)
  }

  const handleTogglePlayback = () => {
    if (!videoPreviewRef.current) return
    if (isPlaying) {
      videoPreviewRef.current.pause()
    } else {
      if (selectedSegment) {
        const currentPreviewTime = videoPreviewRef.current.getCurrentTime()
        const clipEndBoundary = Math.max(
          selectedSegment.start,
          selectedSegment.end - 0.05,
        )

        if (
          currentPreviewTime < selectedSegment.start ||
          currentPreviewTime >= clipEndBoundary
        ) {
          videoPreviewRef.current.seekTo(selectedSegment.start)
          setCurrentTime(selectedSegment.start)
        }
      }
      videoPreviewRef.current.play()
    }
  }

  const handleStepFrame = (direction: -1 | 1) => {
    videoPreviewRef.current?.stepFrame(direction)
  }

  useEffect(() => {
    if (!isPlaying || !selectedSegment || !videoPreviewRef.current) return

    const clipEndBoundary = Math.max(
      selectedSegment.start,
      selectedSegment.end - 0.05,
    )

    if (currentTime < clipEndBoundary) {
      return
    }

    videoPreviewRef.current.pause()
    videoPreviewRef.current.seekTo(clipEndBoundary)
    setCurrentTime(clipEndBoundary)
  }, [currentTime, isPlaying, selectedSegment])

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const handleTimelineZoom = (direction: -1 | 1) => {
    setTimelineZoom((prev) => clamp(prev + direction * 0.5, 1, 4))
  }

  const handleSendAIPrompt = () => {
    const trimmed = aiPromptDraft.trim()
    if (!trimmed) return

    setAiMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      },
    ])
    setAiPromptDraft('')
  }

  useEffect(() => {
    if (!isTimelineDragging) return

    const handlePointerMove = (event: PointerEvent) => {
      seekTimelineFromClientX(event.clientX)
    }

    const handlePointerUp = () => {
      setIsTimelineDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isTimelineDragging, totalDuration])

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
      isActive
        ? isDark
          ? 'bg-[#182238] text-[#8bb8ff] font-semibold shadow-sm'
          : 'bg-white text-[#003fb1] font-semibold shadow-sm'
        : isDark
          ? 'text-[#9fb0ca] hover:bg-[#182238] hover:text-[#8bb8ff]'
          : 'text-[#57657a] hover:bg-white hover:text-[#003fb1]'
    }`

  const timeMarkers = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) =>
        formatClock((editedDuration / 5) * index),
      ),
    [editedDuration],
  )

  return (
    <div
      className={`h-screen overflow-hidden font-sans transition-colors ${
        isDark ? 'bg-[#0b1220] text-[#edf2ff]' : 'bg-[#f7f9fb] text-[#191c1e]'
      }`}
    >
      {exportStatus === 'processing' ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0b1220]/55 px-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-[28px] border px-6 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${
              isDark
                ? 'border-[#31415a] bg-[#111827] text-[#edf2ff]'
                : 'border-[#d9dde5] bg-white text-[#191c1e]'
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(26,86,219,0.12)]">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#1a56db] border-t-transparent" />
            </div>
            <h2
              className={`mt-4 text-[15px] font-bold uppercase tracking-[0.2em] ${
                isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
              }`}
            >
              Rendering Video
            </h2>
            <p
              className={`mt-3 text-sm leading-6 ${
                isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
              }`}
            >
              VidVersity is processing your current clip timeline. Your download
              will start automatically when the render finishes.
            </p>
          </div>
        </div>
      ) : null}

      {appendStatus === 'processing' ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0b1220]/55 px-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-[28px] border px-6 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${
              isDark
                ? 'border-[#31415a] bg-[#111827] text-[#edf2ff]'
                : 'border-[#d9dde5] bg-white text-[#191c1e]'
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(222,52,171,0.12)]">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#de34ab] border-t-transparent" />
            </div>
            <h2
              className={`mt-4 text-[15px] font-bold uppercase tracking-[0.2em] ${
                isDark ? 'text-[#ff9dd7]' : 'text-[#c2187a]'
              }`}
            >
              Processing Video
            </h2>
            <p
              className={`mt-3 text-sm leading-6 ${
                isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
              }`}
            >
              VidVersity is adding the uploaded video to the end of your current
              timeline. This can take a moment for larger files.
            </p>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-[#de34ab] px-5 py-3 text-white shadow-[0_12px_40px_rgba(222,52,171,0.28)]">
        <div className="flex items-center gap-8">
          <div className="font-['Manrope'] text-xl font-extrabold tracking-[-0.04em]">
            Vidversity
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setGuidedMode((prev) => !prev)}
            className="flex items-center gap-3 rounded-full bg-white/18 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] backdrop-blur"
          >
            <span>Guided Mode</span>
            <span
              className={`relative h-5 w-10 rounded-full transition ${
                guidedMode ? 'bg-[#1a56db]' : 'bg-white/35'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                  guidedMode ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className="rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="relative rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/25 bg-white/20 font-semibold">
            NR
          </div>
        </div>
      </header>

      <div
        className={`grid h-[calc(100vh-68px)] grid-cols-1 overflow-hidden ${
          isRightPanelCollapsed
            ? 'xl:grid-cols-[248px_minmax(0,1fr)_72px]'
            : 'xl:grid-cols-[248px_minmax(0,1fr)_340px]'
        } ${isDark ? 'bg-[#0b1220]' : 'bg-[#f7f9fb]'}`}
      >
        <input
          ref={subtitleUploadInputRef}
          type="file"
          accept=".srt,.vtt,text/vtt,application/x-subrip,text/plain"
          className="hidden"
          onChange={handleSubtitleFileSelected}
        />
        <input
          ref={appendVideoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleAppendVideoSelected}
        />

        <aside
          className={`hidden min-h-0 overflow-hidden border-r px-4 py-4 xl:flex xl:flex-col xl:justify-between ${
            isDark
              ? 'border-[#243149] bg-[#121a2b]'
              : 'border-[#d9dde5] bg-[#f2f4f6]'
          }`}
        >
          <div className="space-y-5">
            <nav className="space-y-1 text-sm">
              <NavLink
                to="/drafts"
                className={navLinkClass}
                onClick={(event) => {
                  if (!confirmDiscardChanges()) {
                    event.preventDefault()
                  }
                }}
              >
                <Files className="h-4 w-4" />
                Drafts
              </NavLink>
              <NavLink
                to="/archive"
                className={navLinkClass}
                onClick={(event) => {
                  if (!confirmDiscardChanges()) {
                    event.preventDefault()
                  }
                }}
              >
                <FolderArchive className="h-4 w-4" />
                Archive
              </NavLink>
              <NavLink
                to="/"
                end
                className={navLinkClass}
                onClick={(event) => {
                  if (!confirmDiscardChanges()) {
                    event.preventDefault()
                  }
                }}
              >
                <Clapperboard className="h-4 w-4" />
                Editor
              </NavLink>
            </nav>

            <div
              className={`rounded-[20px] border px-4 py-4 ${
                isDark
                  ? 'border-[#243149] bg-[#0f172a]'
                  : 'border-[#e3e7ee] bg-white'
              }`}
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                  isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
                }`}
              >
                Session Status
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className={isDark ? 'text-[#9fb0ca]' : 'text-[#57657a]'}>
                    Video loaded
                  </span>
                  <span className={isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'}>
                    {selectedVideoFile || videoSourceUrl ? 'Ready' : 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className={isDark ? 'text-[#9fb0ca]' : 'text-[#57657a]'}>
                    Subtitles
                  </span>
                  <span className={isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'}>
                    {subtitleSegments.length > 0
                      ? `${subtitleSegments.length} loaded`
                      : subtitleStatus === 'processing'
                        ? 'Processing'
                        : 'Not added'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className={isDark ? 'text-[#9fb0ca]' : 'text-[#57657a]'}>
                    Silence cleanup
                  </span>
                  <span className={isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'}>
                    {silenceStatus === 'processing'
                      ? 'Analyzing'
                      : silenceStatus === 'success'
                        ? `${selectedSilenceCount}/${silenceSegments.length} selected`
                        : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className={isDark ? 'text-[#9fb0ca]' : 'text-[#57657a]'}>
                    Guided mode
                  </span>
                  <span className={isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'}>
                    {guidedMode ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isDark
                  ? 'border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]'
                  : 'border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]'
              }`}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="button"
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isDark
                  ? 'border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]'
                  : 'border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]'
              }`}
            >
              <FolderArchive className="h-4 w-4" />
              Archive Video
            </button>
            <button
              type="button"
              onClick={() => {
                void handleExportVideo()
              }}
              disabled={
                exportStatus === 'processing' ||
                editorStatus === 'syncing' ||
                (!selectedVideoFile && !editorSessionId)
              }
              className="w-full rounded-xl bg-gradient-to-r from-[#003fb1] to-[#1a56db] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,63,177,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportStatus === 'processing' ? 'Rendering...' : 'Export Video'}
            </button>
          </div>
        </aside>

        <main
          className={`min-h-0 min-w-0 overflow-y-auto overflow-x-hidden ${
            isDark ? 'bg-[#0b1220]' : 'bg-[#f7f9fb]'
          }`}
        >
          <div className="mx-auto flex min-h-full w-full max-w-[1120px] flex-col px-3 py-3 xl:px-4 xl:py-4">
            <div
              className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
                isDark
                  ? 'border-[#243149] bg-[#111827]'
                  : 'border-[#d9dde5] bg-white'
              }`}
            >
              <VideoPreviewPanel
                ref={videoPreviewRef}
                videoUrl={videoSourceUrl ?? preloadedVideoUrl}
                subtitles={subtitleSegments}
                onLoadedMetadata={setVideoDuration}
                onPlaybackStateChange={setIsPlaying}
                onTimeUpdate={setCurrentTime}
                onVideoSourceChange={setVideoSourceUrl}
                onVideoFileChange={(file) => {
                  setSelectedVideoFile(file)
                  resetWorkspaceForNewSource()
                }}
              />

              <section
                className={`mt-auto border-t ${
                  isDark
                    ? 'border-[#243149] bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]'
                    : 'border-[#e3e7ee] bg-[linear-gradient(180deg,#fbfcfd_0%,#f3f6f9_100%)]'
                }`}
              >
                <div className="mx-auto w-full max-w-[1040px] px-4 py-3">
                  <div
                    className={`rounded-[24px] border px-4 py-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${
                      isDark
                        ? 'border-[#243149] bg-[#0f172a]'
                        : 'border-[#d9dde5] bg-white'
                    }`}
                  >
                    <div
                      className={`mb-2.5 flex flex-wrap items-center justify-center gap-3 border-b pb-2.5 ${
                        isDark ? 'border-[#243149]' : 'border-[#edf0f4]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStepFrame(-1)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                            isDark
                              ? 'bg-[#1e293b] text-[#c6d3eb] hover:bg-[#263244] hover:text-[#8bb8ff]'
                              : 'bg-[#f2f4f6] text-[#515f74] hover:bg-[#e7ebf2] hover:text-[#003fb1]'
                          }`}
                        >
                          <SkipBack className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleTogglePlayback}
                          className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                            isDark
                              ? 'bg-[#1b3566] text-[#9ec5ff] hover:bg-[#234178]'
                              : 'bg-[#eef3ff] text-[#003fb1] hover:bg-[#dfe8ff]'
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="h-4.5 w-4.5 fill-current" />
                          ) : (
                            <Play className="ml-0.5 h-4.5 w-4.5 fill-current" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepFrame(1)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                            isDark
                              ? 'bg-[#1e293b] text-[#c6d3eb] hover:bg-[#263244] hover:text-[#8bb8ff]'
                              : 'bg-[#f2f4f6] text-[#515f74] hover:bg-[#e7ebf2] hover:text-[#003fb1]'
                          }`}
                        >
                          <SkipForward className="h-3.5 w-3.5" />
                        </button>
                        <div
                          className={`ml-1.5 text-[12px] font-semibold ${
                            isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
                          }`}
                        >
                          {formatTransportClock(currentTime)} /{' '}
                          {formatTransportClock(totalDuration)}
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
                          isDark
                            ? 'border-[#243149] bg-[#111b2d]'
                            : 'border-[#e3e7ee] bg-[#f8fafc]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTimelineZoom(-1)}
                          disabled={timelineZoom <= 1}
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${
                            isDark
                              ? 'text-[#c6d3eb] hover:bg-[#182238] hover:text-[#8bb8ff]'
                              : 'text-[#515f74] hover:bg-white hover:text-[#003fb1]'
                          }`}
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className={`min-w-[44px] text-center text-[10px] font-bold uppercase tracking-[0.16em] ${
                            isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'
                          }`}
                        >
                          {timelineZoom.toFixed(1)}x
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTimelineZoom(1)}
                          disabled={timelineZoom >= 4}
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${
                            isDark
                              ? 'text-[#c6d3eb] hover:bg-[#182238] hover:text-[#8bb8ff]'
                              : 'text-[#515f74] hover:bg-white hover:text-[#003fb1]'
                          }`}
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <ToolbarButton
                        label="Trim"
                        tooltip="Trim the selected clip to the current playhead."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleTrimIntro}
                        icon={Scissors}
                        tone="editor"
                      />
                      <ToolbarButton
                        label="Split"
                        tooltip="Split the selected clip at the playhead."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleSplitAtPlayhead}
                        icon={Split}
                        tone="editor"
                      />
                      <ToolbarButton
                        label="Merge"
                        tooltip="Merge the selected clips into a single clip."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleMergeWithNext}
                        icon={Clapperboard}
                        disabled={!canMergeWithNext}
                        tone="editor"
                      />
                      <ToolbarButton
                        label="Delete"
                        tooltip="Delete the selected clip from the timeline."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleDeleteSelectedClip}
                        icon={Trash2}
                        disabled={!selectedSegment}
                        danger
                      />
                      <div className="mx-1 h-8 w-px rounded-full bg-[#d9dde5] dark:bg-[#31415a]" />
                      <ToolbarButton
                        label="Add Video"
                        tooltip="Add another video to the end of the timeline."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleAppendVideoClick}
                        icon={Plus}
                        disabled={
                          appendStatus === 'processing' ||
                          exportStatus === 'processing' ||
                          editorStatus === 'syncing' ||
                          (!selectedVideoFile && !videoSourceUrl && !preloadedVideoUrl)
                        }
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="Subtitles"
                        tooltip={
                          subtitleSegments.length > 0
                            ? 'Open subtitles to review and edit your captions.'
                            : 'Open subtitles to generate or add captions.'
                        }
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleOpenSubtitlesPanel}
                        icon={Subtitles}
                        disabled={subtitleStatus === 'processing'}
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="Silencer"
                        tooltip="Find silent parts you may want to remove."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleRemoveSilence}
                        icon={Mic}
                        disabled={silenceStatus === 'processing'}
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="Scenes"
                        tooltip="Review scene changes and split points."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleOpenScenesPanel}
                        icon={Clapperboard}
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="AI"
                        tooltip="Open AI tools for editing help."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleOpenAIPanel}
                        icon={Sparkles}
                        tone="workspace"
                      />
                      <div className="mx-1 h-8 w-px rounded-full bg-[#d9dde5] dark:bg-[#31415a]" />
                      <ToolbarButton
                        label="Undo"
                        tooltip="Undo your last change."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleUndo}
                        icon={RotateCcw}
                        disabled={history.length === 0}
                        tone="global"
                      />
                    </div>
                  </div>
                </div>

                {subtitleError ? (
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-4">
                    <div
                      className={`max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${
                        isDark
                          ? 'border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]'
                          : 'border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]'
                      }`}
                    >
                      {subtitleError}
                    </div>
                  </div>
                ) : null}

                {silenceError ? (
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-4">
                    <div
                      className={`max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${
                        isDark
                          ? 'border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]'
                          : 'border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]'
                      }`}
                    >
                      {silenceError}
                    </div>
                  </div>
                ) : null}

                {editorError ? (
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-4">
                    <div
                      className={`max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${
                        isDark
                          ? 'border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]'
                          : 'border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]'
                      }`}
                    >
                      {editorError}
                    </div>
                  </div>
                ) : null}

                {exportError ? (
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-4">
                    <div
                      className={`max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[20px] border px-4 py-3 text-[12px] leading-5 ${
                        isDark
                          ? 'border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]'
                          : 'border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]'
                      }`}
                    >
                      {exportError}
                    </div>
                  </div>
                ) : null}

                <div className="mx-auto w-full max-w-[1040px] px-4 pb-4">
                  <div
                    className={`rounded-[24px] border px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${
                      isDark
                        ? 'border-[#243149] bg-[#0f172a]'
                        : 'border-[#d9dde5] bg-white'
                    }`}
                  >
                    <div className="overflow-x-auto pb-1">
                      <div className="relative min-w-full" style={{ width: `${timelineZoom * 100}%` }}>
                        <div className="relative">
                          <div
                            ref={timelineTrackRef}
                            className="relative"
                            onPointerDown={(event) => {
                              seekTimelineFromClientX(event.clientX)
                              setIsTimelineDragging(true)
                            }}
                          >
                            <div
                              className={`relative flex min-h-[84px] items-stretch gap-1 overflow-hidden rounded-2xl border p-2 ${
                                isDark
                                  ? 'border-[#2b3950] bg-[#1a2435]'
                                  : 'border-[#dfe5ec] bg-[#eff3f8]'
                              }`}
                            >
                              {segments.map((segment) => {
                                const duration = Math.max(0.1, segment.end - segment.start)
                                const isSelected = selectedId === segment.id
                                const containsPlayhead =
                                  currentTime >= segment.start &&
                                  currentTime <= segment.end
                                const playheadRatio = containsPlayhead
                                  ? clamp(
                                      (currentTime - segment.start) /
                                        Math.max(segment.end - segment.start, 0.001),
                                      0,
                                      1,
                                    )
                                  : 0
                                const segmentFrames = getSegmentTimelineFrames(
                                  timelineThumbnails,
                                  segment,
                                )

                                return (
                                  <button
                                    key={segment.id}
                                    type="button"
                                    onPointerDown={(event) => {
                                      event.stopPropagation()
                                      const bounds =
                                        event.currentTarget.getBoundingClientRect()
                                      const ratio = clamp(
                                        (event.clientX - bounds.left) / bounds.width,
                                        0,
                                        1,
                                      )
                                      const nextTime =
                                        segment.start +
                                        (segment.end - segment.start) * ratio
                                      setSelectedId(segment.id)
                                      handleSeek(nextTime)
                                    }}
                                    style={{ flexGrow: duration }}
                                    className={`relative flex min-w-[110px] flex-1 flex-col justify-end overflow-hidden rounded-xl border text-left transition ${
                                      isSelected
                                        ? isDark
                                          ? 'border-[#8bb8ff] bg-[#1f4da0] text-white'
                                          : 'border-[#003fb1] bg-[#1a56db] text-white'
                                        : isDark
                                          ? 'border-[#344561] bg-[#101a2a] text-[#d6deec] hover:border-[#8bb8ff]'
                                          : 'border-[#c9d5e8] bg-white text-[#233147] hover:border-[#1a56db]'
                                    }`}
                                  >
                                    {containsPlayhead ? (
                                      <>
                                        <span
                                          className="absolute inset-y-1 z-20 w-0.5 -translate-x-1/2 bg-[#de34ab]"
                                          style={{ left: `${playheadRatio * 100}%` }}
                                        />
                                        <span
                                          className="absolute top-1 z-20 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[8px] border-x-transparent border-b-[#de34ab]"
                                          style={{ left: `${playheadRatio * 100}%` }}
                                        />
                                      </>
                                    ) : null}

                                    <div className="absolute inset-0">
                                      {timelineMediaReady && segmentFrames.length > 0 ? (
                                        <div className="flex h-full w-full">
                                          {segmentFrames.map((thumbnail) => (
                                            <div
                                              key={`${segment.id}-${thumbnail.id}`}
                                              className="relative h-full flex-1 overflow-hidden border-r border-white/15 last:border-r-0"
                                            >
                                              <img
                                                src={thumbnail.src}
                                                alt={`Frame at ${formatClock(thumbnail.time)}`}
                                                className="h-full w-full object-cover"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div
                                          className={`h-full w-full ${
                                            isDark
                                              ? 'bg-[linear-gradient(90deg,#182234_0%,#223047_100%)]'
                                              : 'bg-[linear-gradient(90deg,#e7ebf0_0%,#dfe5ec_100%)]'
                                          }`}
                                        />
                                      )}
                                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.62))]" />
                                    </div>

                                    <div className="relative z-10 px-3 py-2">
                                      <span className="block truncate pl-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                                        {segment.label}
                                      </span>
                                      <span
                                        className={`block pl-2 text-[11px] ${
                                          isSelected
                                            ? 'text-white/90'
                                            : isDark
                                              ? 'text-[#d6deec]'
                                              : 'text-white/95'
                                        }`}
                                      >
                                        Source {formatClock(segment.start)} - {formatClock(segment.end)}
                                      </span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="pt-1">
                          <div
                            className={`mb-1 flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.18em] ${
                              isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'
                            }`}
                          >
                            <span>
                              {segments.length} clip{segments.length === 1 ? '' : 's'}
                            </span>
                            <span>
                              {editorStatus === 'syncing'
                                ? 'Syncing editor'
                                : editorSessionId
                                  ? 'Editor session active'
                                  : selectedVideoFile
                                    ? 'Ready to create editor session'
                                    : 'Upload a local video to edit'}
                            </span>
                          </div>
                          <div
                            className={`mb-1 flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.18em] ${
                              isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'
                            }`}
                          >
                            <span>Edited Timeline</span>
                            <span>{formatClock(editedDuration)}</span>
                          </div>
                          <div
                            className={`flex justify-between px-2 text-[9px] font-mono ${
                              isDark ? 'text-[#8fa2c2]' : 'text-[#737686]'
                            }`}
                          >
                            {timeMarkers.map((marker) => (
                              <span key={marker}>{marker}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <aside
          className={`hidden min-h-0 overflow-hidden border-l px-4 py-4 xl:flex xl:flex-col ${
            isDark
              ? 'border-[#243149] bg-[#121a2b]'
              : 'border-[#d9dde5] bg-white'
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            {!isRightPanelCollapsed ? (
              <div className="flex items-center gap-2">
                {rightPanelView === 'silence' ? (
                  <Mic className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                ) : rightPanelView === 'scenes' ? (
                  <Clapperboard className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                ) : rightPanelView === 'subtitles' ? (
                  <Subtitles className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                ) : (
                  <Sparkles className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                )}
                <h2
                  className={`text-[12px] font-bold uppercase tracking-[0.18em] ${
                    isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
                  }`}
                >
                  {rightPanelView === 'silence'
                    ? 'Silence Review'
                    : rightPanelView === 'scenes'
                      ? 'Scene Review'
                    : rightPanelView === 'subtitles'
                      ? 'Subtitles'
                      : 'AI Workspace'}
                </h2>
              </div>
            ) : (
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#003fb1] dark:bg-[#1b3566] dark:text-[#9ec5ff]">
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsRightPanelCollapsed((prev) => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                isDark
                  ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:bg-[#182238]'
                  : 'border-[#d9dde5] bg-[#fbfcfd] text-[#515f74] hover:bg-white'
              }`}
              title={isRightPanelCollapsed ? 'Expand right panel' : 'Collapse right panel'}
            >
              {isRightPanelCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {isRightPanelCollapsed ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-between py-2">
              <div className="writing-mode-vertical text-center [writing-mode:vertical-rl]">
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                    isDark ? 'text-[#8fa2c2]' : 'text-[#737686]'
                  }`}
                >
                  {rightPanelView === 'silence'
                    ? 'Silence Review'
                    : rightPanelView === 'scenes'
                      ? 'Scene Review'
                    : rightPanelView === 'subtitles'
                      ? 'Subtitles'
                      : 'AI Workspace'}
                </span>
              </div>
              <div className="space-y-2">
                {(rightPanelView === 'silence'
                  ? ['Silence', 'Review', 'Timeline']
                  : rightPanelView === 'scenes'
                    ? ['Scenes', 'Review', 'Split']
                  : rightPanelView === 'subtitles'
                    ? ['Subtitles', 'Review', 'Export']
                  : ['Chapters', 'Trim', 'Captions']
                ).map((item) => (
                  <div
                    key={item}
                    className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
                      isDark
                        ? 'bg-[#111827] text-[#8fa2c2]'
                        : 'bg-[#f2f4f6] text-[#637287]'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`flex min-h-0 flex-1 flex-col rounded-[22px] border p-4 ${
                isDark
                  ? 'border-[#31415a] bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]'
                  : 'border-[#d9dde5] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fb_100%)]'
              }`}
            >
                {rightPanelView === 'silence' ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div
                    className={`mb-4 rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleRemoveSilence()
                        }}
                        disabled={silenceStatus === 'processing'}
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Detect Again
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectAllSilences}
                        disabled={silenceReviewItems.length === 0}
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelectedSilences}
                        disabled={selectedSilenceSegmentKeys.length === 0}
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleApplySelectedSilences}
                        disabled={selectedSilenceSegmentKeys.length === 0}
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {silenceError ? (
                    <div
                      className={`mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${
                        isDark
                          ? 'border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]'
                          : 'border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]'
                      }`}
                    >
                      {silenceError}
                    </div>
                  ) : null}

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {silenceStatus === 'processing' ? (
                      <div
                        className={`rounded-2xl border px-5 py-5 text-[12px] leading-6 ${
                          isDark
                            ? 'border-[#243149] bg-[#111827] text-[#9fb0ca]'
                            : 'border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]'
                        }`}
                      >
                        Analyzing the uploaded video for long silence ranges...
                      </div>
                    ) : silenceSegments.length === 0 ? (
                      <div
                        className={`rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${
                          isDark
                            ? 'border-[#31415a] bg-[#111827] text-[#8fa2c2]'
                            : 'border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]'
                        }`}
                      >
                        No silence ranges to review yet. Upload a local video and
                        run Remove silence to populate this panel.
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto pr-1">
                        <div
                          className={`rounded-2xl border px-4 py-3 text-[12px] leading-5 ${
                            isDark
                              ? 'border-[#243149] bg-[#111827] text-[#9fb0ca]'
                              : 'border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {selectedSilenceCount} of {silenceReviewItems.length} selected
                            </span>
                            <span>
                              {stagedSilenceCount > 0
                                ? `${stagedSilenceCount} staged for future removal`
                                : 'Analysis only, not applied yet'}
                            </span>
                          </div>
                        </div>

                        {silenceReviewItems.map((segment) => {
                          const isSelected = selectedSilenceSegmentKeys.includes(segment.key)
                          const isStaged = stagedSilenceSegmentKeys.includes(segment.key)

                          return (
                          <div
                            key={segment.key}
                            className={`rounded-2xl border p-4 shadow-sm transition ${
                              isSelected
                                ? isDark
                                  ? 'border-[#4b6388] bg-[#131f33]'
                                  : 'border-[#7aa4ff] bg-[#f6f9ff]'
                                : isDark
                                  ? 'border-[#31415a] bg-[#111827]'
                                  : 'border-[#d9dde5] bg-[#fbfcfd]'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-mono ${
                                      isDark
                                        ? 'bg-[#1e293b] text-[#c6d3eb]'
                                        : 'bg-[#f2f4f6] text-[#515f74]'
                                    }`}
                                  >
                                    {formatEditableTimestamp(segment.start)} -{' '}
                                    {formatEditableTimestamp(segment.end)}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                      isDark
                                        ? 'bg-[#24141a] text-[#ffb8c0]'
                                        : 'bg-[#fff3f4] text-[#a23535]'
                                    }`}
                                  >
                                    Silence {segment.index + 1}
                                  </span>
                                  {isStaged ? (
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                        isDark
                                          ? 'bg-[#1b3566] text-[#9ec5ff]'
                                          : 'bg-[#eef3ff] text-[#003fb1]'
                                      }`}
                                    >
                                      Staged
                                    </span>
                                  ) : null}
                                </div>
                                <p
                                  className={`mt-2 text-[12px] leading-5 ${
                                    isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
                                  }`}
                                >
                                  Duration: {(segment.end - segment.start).toFixed(1)}s
                                  {' · '}
                                  {isSelected
                                    ? 'Selected for future removal'
                                    : 'Excluded from the staged set'}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSilenceSelection(segment.key)}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                                    isSelected
                                      ? isDark
                                        ? 'border-[#4b6388] bg-[#182238] text-[#9ec5ff]'
                                        : 'border-[#7aa4ff] bg-[#eef3ff] text-[#003fb1]'
                                      : isDark
                                        ? 'border-[#31415a] text-[#c6d3eb]'
                                        : 'border-[#d9dde5] text-[#515f74]'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSeek(segment.start)}
                                  className="rounded-full bg-[#003fb1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                                >
                                  Go to
                                </button>
                              </div>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : rightPanelView === 'scenes' ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div
                    className={`mb-4 rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleOpenScenesPanel}
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition"
                      >
                        Detect Scenes
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Add Scene
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit Scenes
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Implement
                      </button>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div
                      className={`mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${
                        isDark
                          ? 'border-[#243149] bg-[#111827] text-[#9fb0ca]'
                          : 'border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]'
                      }`}
                    >
                      {sceneStatus === 'pending'
                        ? 'Scene review UI is ready. Once backend detection is implemented, detected scene timestamps will appear here for review, editing, and split actions.'
                        : 'Open Detect scenes to start reviewing scene boundaries.'}
                    </div>

                    <div
                      className={`rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${
                        isDark
                          ? 'border-[#31415a] bg-[#111827] text-[#8fa2c2]'
                          : 'border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]'
                      }`}
                    >
                      <p>
                        No scene timestamps are available yet.
                      </p>
                      <p className="mt-3">
                        This panel will eventually show:
                      </p>
                      <div className="mt-3 space-y-3">
                        {[
                          'Detected scene time ranges with Go to controls',
                          'Editable scene labels and boundary timestamps',
                          'An Implement action to split the video by scene boundaries',
                        ].map((item) => (
                          <div
                            key={item}
                            className={`rounded-2xl border px-4 py-3 ${
                              isDark
                                ? 'border-[#243149] bg-[#0f172a]'
                                : 'border-[#e3e7ee] bg-white'
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : rightPanelView === 'subtitles' ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div
                    className={`mb-4 rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    {subtitleSegments.length === 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleSubtitleUploadClick}
                          disabled={subtitleEntryStatus !== 'idle'}
                          className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Add Subtitles
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleGenerateSubtitlesFromPanel()
                          }}
                          disabled={subtitleEntryStatus !== 'idle'}
                          className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Generate
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleSubtitleUploadClick}
                          className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSubtitles}
                          className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportSubtitle('srt')}
                          disabled={subtitleSegments.length === 0}
                          className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Export SRT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportSubtitle('vtt')}
                          disabled={subtitleSegments.length === 0}
                          className="flex h-9 items-center justify-center rounded-xl bg-[#003fb1] px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Export VTT
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {subtitleError ? (
                      <div
                        className={`mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${
                          isDark
                            ? 'border-[#6f3a45] bg-[#24141a] text-[#ffb8c0]'
                            : 'border-[#f0b8b8] bg-[#fff3f4] text-[#a23535]'
                        }`}
                      >
                        {subtitleError}
                      </div>
                    ) : null}

                    {subtitleSegments.length === 0 ? (
                      <>
                        <div
                          className={`mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5 ${
                            isDark
                              ? 'border-[#243149] bg-[#111827] text-[#9fb0ca]'
                              : 'border-[#e3e7ee] bg-[#fbfcfd] text-[#57657a]'
                          }`}
                        >
                          {subtitleEntryStatus === 'uploading'
                            ? 'Uploading subtitles into the current edit...'
                            : subtitleEntryStatus === 'generating'
                              ? 'Generating subtitles from the uploaded video...'
                              : subtitleEntryStatus === 'success'
                                ? 'Subtitles are ready.'
                                : 'Choose Generate to create subtitles from the current video, or Add Subtitles to import an .srt or .vtt file.'}
                        </div>
                        <div
                          className={`rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${
                            isDark
                              ? 'border-[#31415a] bg-[#111827] text-[#8fa2c2]'
                              : 'border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]'
                          }`}
                        >
                          No subtitles are available yet. Use this panel to generate a new subtitle pass or add an existing subtitle file without leaving the editor.
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 overflow-y-auto pr-1">
                        {subtitleSegments.map((segment) => (
                          <div
                            key={segment.id}
                            className={`rounded-2xl border p-4 shadow-sm ${
                              isDark
                                ? 'border-[#31415a] bg-[#111827]'
                                : 'border-[#d9dde5] bg-[#fbfcfd]'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-mono ${
                                    isDark
                                      ? 'bg-[#1e293b] text-[#c6d3eb]'
                                      : 'bg-[#f2f4f6] text-[#515f74]'
                                  }`}
                                >
                                  {formatClock(segment.start)} - {formatClock(segment.end)}
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#8fa2c2]">
                                    <span>Start</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={getSubtitleTimingDraft(segment, 'start')}
                                      onChange={(event) =>
                                        handleSubtitleTimingDraftChange(
                                          segment.id,
                                          'start',
                                          event.target.value,
                                        )
                                      }
                                      onBlur={() =>
                                        handleSubtitleTimingDraftCommit(segment, 'start')
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                          event.currentTarget.blur()
                                        }
                                      }}
                                      className={`w-20 rounded-full border px-2 py-1 text-[11px] font-medium outline-none transition ${
                                        isDark
                                          ? 'border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa]'
                                          : 'border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db]'
                                      }`}
                                    />
                                  </label>
                                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#8fa2c2]">
                                    <span>End</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={getSubtitleTimingDraft(segment, 'end')}
                                      onChange={(event) =>
                                        handleSubtitleTimingDraftChange(
                                          segment.id,
                                          'end',
                                          event.target.value,
                                        )
                                      }
                                      onBlur={() =>
                                        handleSubtitleTimingDraftCommit(segment, 'end')
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                          event.currentTarget.blur()
                                        }
                                      }}
                                      className={`w-20 rounded-full border px-2 py-1 text-[11px] font-medium outline-none transition ${
                                        isDark
                                          ? 'border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa]'
                                          : 'border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db]'
                                      }`}
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSeek(segment.start)}
                                  className="rounded-full bg-[#003fb1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                                >
                                  Go to
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubtitle(segment.id)}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                                    isDark
                                      ? 'border-[#6f3a45] text-[#ff8f9a]'
                                      : 'border-[#f0b8b8] text-[#a23535]'
                                  }`}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={segment.text}
                              onChange={(event) =>
                                handleUpdateSubtitle({
                                  ...segment,
                                  text: event.target.value,
                                })
                              }
                              className={`mt-3 min-h-[88px] w-full resize-none rounded-2xl border px-3 py-3 text-[12px] leading-5 outline-none transition ${
                                isDark
                                  ? 'border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa] focus:bg-[#111827]'
                                  : 'border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db] focus:bg-white'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        isDark
                          ? 'bg-[#1b3566] text-[#9ec5ff]'
                          : 'bg-[#eef3ff] text-[#003fb1]'
                      }`}
                    >
                      <Send className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {AI_QUICK_ACTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAiPromptDraft(item)}
                        className={`rounded-full border px-3 py-2 text-left text-[12px] transition ${
                          isDark
                            ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:border-[#4b6388] hover:bg-[#131f33]'
                            : 'border-[#d9dde5] bg-white text-[#515f74] hover:border-[#7aa4ff] hover:bg-[#f6f9ff]'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {aiMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-5 ${
                            message.role === 'user'
                              ? isDark
                                ? 'ml-auto bg-[#1b3566] text-[#edf2ff]'
                                : 'ml-auto bg-[#eef3ff] text-[#003fb1]'
                              : isDark
                                ? 'bg-[#111827] text-[#c6d3eb]'
                                : 'bg-white text-[#515f74]'
                          }`}
                        >
                          {message.text}
                        </div>
                      ))}
                    </div>

                    <div
                      className={`mt-4 flex items-end gap-2 rounded-2xl border px-3 py-3 ${
                        isDark
                          ? 'border-[#31415a] bg-[#111827]'
                          : 'border-[#d9dde5] bg-white'
                      }`}
                    >
                      <textarea
                        value={aiPromptDraft}
                        onChange={(event) => setAiPromptDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            handleSendAIPrompt()
                          }
                        }}
                        placeholder="Ask AI to edit..."
                        className={`min-h-[72px] flex-1 resize-none bg-transparent text-[12px] leading-5 outline-none ${
                          isDark
                            ? 'text-[#edf2ff] placeholder:text-[#71839d]'
                            : 'text-[#191c1e] placeholder:text-[#9aa3b2]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleSendAIPrompt}
                        disabled={aiPromptDraft.trim().length === 0}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          isDark
                            ? 'bg-[#1b3566] text-[#edf2ff] hover:bg-[#234178]'
                            : 'bg-[#003fb1] text-white hover:bg-[#1a56db]'
                        }`}
                        title="Send AI prompt"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

    </div>
  )
}
