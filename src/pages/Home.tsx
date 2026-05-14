import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Bell,
  BookOpen,
  Brush,
  Check,
  CheckCheck,
  Clapperboard,
  CircleX,
  Files,
  Download,
  FolderArchive,
  HelpCircle,
  History,
  Lightbulb,
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
  Redo2,
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
  cutEditorSessionToRange,
  createEditorSessionFromVideo,
  deleteEditorSessionVersion,
  deleteSilenceRangesFromEditorSession,
  detectSilenceFromVideo,
  detectSilenceInEditorSession,
  downloadEditorSessionSourceFile,
  downloadEditorSessionVersion,
  type EditorSessionState,
  type EditorVersionInfo,
  exportEditorSessionVideo,
  listEditorSessionVersions,
  mergeEditorSessionSegments,
  replaceEditorSessionSegments,
  saveEditorSessionVersion,
  splitEditorSessionAtTime,
  switchEditorSessionVersion,
  generateSubtitlesFromVideo,
  updateEditorSessionCategory,
} from '../subtitles/api'
import { importSubtitlesFromFile } from '../subtitles/import'
import type { SubtitleSegment } from '../subtitles/types'
import { Input } from '../components/ui/input'
import { requestAIChapterSuggestions, requestAIEditCommand } from '../ai/api'
import type { AIEditSuggestion } from '../ai/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

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
  playbackMode: 'edited' | 'original'
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
  sourceRanges?: ClipSourceRange[]
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

interface ClipSourceRange {
  start: number
  end: number
}

interface OriginalTimelineSection {
  kind: 'kept' | 'removed'
  start: number
  end: number
}

interface ReorderedSegmentsResult {
  segments: ClipSegment[]
  moved: boolean
}

interface EditorHistoryEntry {
  segments: ClipSegment[]
  selectedId: number | null
  selectedIds: number[]
  subtitleSegments: SubtitleSegment[]
}

interface AIDraftMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  suggestion?: AIEditSuggestion
}

type SubtitleStatus = 'idle' | 'processing' | 'success' | 'error'
type SilenceStatus = 'idle' | 'processing' | 'success' | 'error'
type EditorStatus = 'idle' | 'syncing' | 'ready' | 'error'
type ExportStatus = 'idle' | 'processing' | 'error'
type ExportKind = 'clip' | 'video'
type AppendStatus = 'idle' | 'processing'
type MergeStatus = 'idle' | 'processing'
type SubtitleTimingField = 'start' | 'end'
type SubtitleEntryStatus = 'idle' | 'uploading' | 'generating' | 'success'
type RightPanelView = 'ai' | 'silence' | 'subtitles' | 'chapters' | 'done'
type CutHandle = 'start' | 'end'
type PreviewPlaybackMode = 'edited' | 'original'
type WorkflowStepId = 'clean' | 'polish' | 'chapters' | 'course' | ''
type DoneActionKind =
  | 'save-draft'
  | 'archive-video'
  | 'add-existing-course'
  | 'add-new-course'

const CUT_RANGE_MIN_GAP = 0.1

interface ToolbarButtonProps {
  label: string
  tooltip: string
  guidedMode: boolean
  isDark: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  danger?: boolean
  active?: boolean
  emphasized?: boolean
  tone?: 'editor' | 'workspace' | 'global'
  size?: 'default' | 'compact'
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
  'Cut the introduction from 00:00 to 01:30',
  'Split the video at 04:20',
  'Remove silent parts longer than 3 seconds',
  'Help me add subtitles',
  'Split the video into chapters',
]

const CATEGORY_STORAGE_KEY = 'vidversity-video-categories'
const DONE_METADATA_STORAGE_KEY = 'vidversity-done-action-metadata'
const DEFAULT_CATEGORY_VALUE = '__none__'
const NEW_CATEGORY_VALUE = '__new__'
const EXISTING_COURSE_OPTIONS = ['Course 1', 'Course 2', 'Course 3']
const EDITOR_HOTKEY_TEXT_ENTRY_TARGET_SELECTOR =
  'input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])'

function normalizeCategoryName(category: string): string {
  return category.trim().replace(/\s+/g, ' ')
}

function readStoredCategories(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => normalizeCategoryName(`${item ?? ''}`))
      .filter((item, index, items) => {
        if (item.length === 0) {
          return false
        }

        return (
          items.findIndex(
            (candidate) => candidate.toLowerCase() === item.toLowerCase(),
          ) === index
        )
      })
  } catch {
    return []
  }
}

function mergeCategoryOptions(
  categories: string[],
  additionalCategory?: string | null,
): string[] {
  const nextCategories: string[] = []
  const seen = new Set<string>()

  ;[...categories, normalizeCategoryName(additionalCategory ?? '')].forEach((category) => {
    if (!category) {
      return
    }

    const key = category.toLowerCase()
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    nextCategories.push(category)
  })

  return nextCategories
}

function formatClock(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

function orderClipSelectionIds(
  segments: ClipSegment[],
  segmentIds: number[],
): number[] {
  if (segmentIds.length === 0) {
    return []
  }

  const selectedIdSet = new Set(segmentIds)
  return segments
    .filter((segment) => selectedIdSet.has(segment.id))
    .map((segment) => segment.id)
}

function getClipSelectionRangeIds(
  segments: ClipSegment[],
  anchorId: number,
  targetId: number,
): number[] {
  const anchorIndex = segments.findIndex((segment) => segment.id === anchorId)
  const targetIndex = segments.findIndex((segment) => segment.id === targetId)

  if (anchorIndex < 0 || targetIndex < 0) {
    return [targetId]
  }

  const startIndex = Math.min(anchorIndex, targetIndex)
  const endIndex = Math.max(anchorIndex, targetIndex)
  return segments.slice(startIndex, endIndex + 1).map((segment) => segment.id)
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

function isEditorHotkeyTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest(EDITOR_HOTKEY_TEXT_ENTRY_TARGET_SELECTOR))
  )
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

function getVideoTitleFromSource(
  file?: File | null,
  sourceUrl?: string | null,
  fallbackUrl?: string | null,
): string {
  const fileName = file?.name?.trim()
  if (fileName) {
    return fileName.replace(/\.[^.]+$/, '')
  }

  const url = sourceUrl || fallbackUrl
  if (!url) {
    return 'Untitled Video'
  }

  try {
    const parsedUrl = new URL(url, window.location.href)
    const pathName = decodeURIComponent(parsedUrl.pathname)
    const baseName = pathName.split('/').filter(Boolean).at(-1)
    return baseName?.replace(/\.[^.]+$/, '') || 'Untitled Video'
  } catch {
    const baseName = url.split('/').filter(Boolean).at(-1)
    return baseName?.replace(/\.[^.]+$/, '') || 'Untitled Video'
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTimelineTimestampStyle(ratio: number): React.CSSProperties {
  const safeRatio = clamp(ratio, 0, 1)

  if (safeRatio <= 0.06) {
    return { left: '8px', transform: 'none' }
  }

  if (safeRatio >= 0.94) {
    return { left: 'calc(100% - 8px)', transform: 'translateX(-100%)' }
  }

  return { left: `${safeRatio * 100}%`, transform: 'translateX(-50%)' }
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
  active = false,
  emphasized = false,
  size = 'default',
}: ToolbarButtonProps): JSX.Element {
  const styles = active
    ? danger
      ? isDark
        ? 'bg-[#3a1c24] text-[#ffb7c0] shadow-[0_10px_24px_rgba(162,53,53,0.18)]'
        : 'bg-[#fff0f1] text-[#a23535] shadow-[0_10px_24px_rgba(162,53,53,0.14)]'
      : isDark
        ? 'bg-[#1b3566] text-[#cfe3ff] shadow-[0_10px_24px_rgba(26,86,219,0.22)]'
        : 'bg-[#e8f0ff] text-[#00308a] shadow-[0_10px_24px_rgba(0,63,177,0.16)]'
    : emphasized
      ? danger
        ? isDark
          ? 'text-[#ffb7c0] hover:bg-[#2a1820]'
          : 'text-[#a23535] hover:bg-[#fff1f1]'
        : isDark
          ? 'text-[#8bb8ff] hover:bg-[#22314a]'
          : 'text-[#1a56db] hover:bg-[#f2f4f6]'
    : danger
      ? isDark
        ? 'text-[#ff8f9a]/75 hover:bg-[#2a1820] hover:text-[#ffb7c0]'
        : 'text-[#a23535]/70 hover:bg-[#fff1f1] hover:text-[#a23535]'
      : isDark
        ? 'text-[#8fa2c2] hover:bg-[#22314a] hover:text-[#f2f6ff]'
        : 'text-[#7a8798] hover:bg-[#f2f4f6] hover:text-[#37465d]'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center gap-0.5 overflow-visible rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
        size === 'compact' ? 'px-2 py-1' : 'px-2.5 py-1.5'
      } ${styles}`}
    >
      <Icon className={size === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span
        className={`${active || emphasized ? 'font-extrabold' : 'font-semibold'} uppercase ${
          size === 'compact'
            ? 'text-[7px] tracking-[0.14em]'
            : 'text-[8px] tracking-[0.18em]'
        }`}
      >
        {label}
      </span>
      {guidedMode && (
        <div
          className={`pointer-events-none absolute left-1/2 top-full z-[300] mt-2 hidden w-44 -translate-x-1/2 rounded-2xl border p-3 text-left shadow-xl group-hover:block ${
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
      playbackMode,
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
        <div className="w-full max-w-[900px]">
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                playbackMode === 'original'
                  ? 'bg-[#fff0f8] text-[#a20f66] dark:bg-[#31192e] dark:text-[#ffb3de]'
                  : 'bg-[#eef3ff] text-[#003fb1] dark:bg-[#1b3566] dark:text-[#9ec5ff]'
              }`}
            >
              {playbackMode === 'original'
                ? 'Playing Original Video'
                : 'Playing Edited Video'}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[24px] bg-black shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
          {videoUrl ? (
            <video
              ref={videoRef}
              className="aspect-video max-h-[44vh] w-full bg-black object-contain"
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
              className="relative aspect-video max-h-[44vh] w-full overflow-hidden bg-black text-left transition hover:bg-[#05070b]"
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
  return [{ id: 1, label: 'Chapter 1', start: 0, end: safeDuration }]
}

function getClipSourceRanges(segment: ClipSegment): ClipSourceRange[] {
  const ranges =
    Array.isArray(segment.sourceRanges) && segment.sourceRanges.length > 0
      ? segment.sourceRanges
      : [{ start: segment.start, end: segment.end }]

  return ranges
    .map((range) => ({
      start: Number(range.start),
      end: Number(range.end),
    }))
    .filter(
      (range) =>
        Number.isFinite(range.start) &&
        Number.isFinite(range.end) &&
        range.end > range.start,
    )
}

function getClipDuration(segment: ClipSegment): number {
  return getClipSourceRanges(segment).reduce(
    (sum, range) => sum + Math.max(0, range.end - range.start),
    0,
  )
}

function getClipSourceStart(segment: ClipSegment): number {
  return getClipSourceRanges(segment)[0]?.start ?? segment.start
}

function getClipSourceEnd(segment: ClipSegment): number {
  const ranges = getClipSourceRanges(segment)
  return ranges[ranges.length - 1]?.end ?? segment.end
}

function isSourceTimeInsideClip(segment: ClipSegment, time: number): boolean {
  return getClipSourceRanges(segment).some(
    (range) => time >= range.start && time <= range.end,
  )
}

function mapClipEditedOffsetToSourceTime(
  segment: ClipSegment,
  editedOffset: number,
): number {
  const ranges = getClipSourceRanges(segment)
  if (ranges.length === 0) return segment.start

  let consumedDuration = 0
  const safeOffset = Math.max(0, editedOffset)

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index]
    const duration = range.end - range.start
    const nextConsumedDuration = consumedDuration + duration
    if (safeOffset <= nextConsumedDuration || index === ranges.length - 1) {
      return range.start + clamp(safeOffset - consumedDuration, 0, duration)
    }
    consumedDuration = nextConsumedDuration
  }

  return ranges[ranges.length - 1].end
}

function mapSourceTimeToClipEditedOffset(
  segment: ClipSegment,
  sourceTime: number,
): number {
  const ranges = getClipSourceRanges(segment)
  let consumedDuration = 0

  for (const range of ranges) {
    const duration = range.end - range.start
    if (sourceTime >= range.start && sourceTime <= range.end) {
      return consumedDuration + clamp(sourceTime - range.start, 0, duration)
    }
    consumedDuration += duration
  }

  return clamp(sourceTime - segment.start, 0, getClipDuration(segment))
}

function formatClipSourceRange(segment: ClipSegment): string {
  const ranges = getClipSourceRanges(segment)
  if (ranges.length <= 1) {
    const range = ranges[0] ?? { start: segment.start, end: segment.end }
    return `${formatClock(range.start)} - ${formatClock(range.end)}`
  }

  return ranges
    .map((range) => `${formatClock(range.start)}-${formatClock(range.end)}`)
    .join(', ')
}

function getDefaultChapterLabel(index: number): string {
  return `Chapter ${index + 1}`
}

function normalizeSegmentLabel(label: string | null | undefined, index: number): string {
  const trimmed = label?.trim()
  if (!trimmed) {
    return getDefaultChapterLabel(index)
  }

  if (
    /^clip\s+\d+$/i.test(trimmed) ||
    /^chapter\s+\d+$/i.test(trimmed) ||
    /^full video$/i.test(trimmed)
  ) {
    return getDefaultChapterLabel(index)
  }

  return trimmed
}

function relabelSegmentsForChapters(segments: ClipSegment[]): ClipSegment[] {
  return segments.map((segment, index) => ({
    ...segment,
    label: normalizeSegmentLabel(segment.label, index),
  }))
}

function preserveChapterLabels(
  previousSegments: ClipSegment[],
  nextSegments: ClipSegment[],
): ClipSegment[] {
  const normalizedNextSegments = relabelSegmentsForChapters(nextSegments)
  const assignedLabels = new Map<number, string>()
  const tolerance = 0.02

  previousSegments.forEach((previousSegment, previousIndex) => {
    const baseLabel = normalizeSegmentLabel(previousSegment.label, previousIndex)
    const matches = normalizedNextSegments
      .map((segment, nextIndex) => ({ segment, nextIndex }))
      .filter(({ segment }) => {
        const startsInside =
          getClipSourceStart(segment) >= getClipSourceStart(previousSegment) - tolerance
        const endsInside =
          getClipSourceEnd(segment) <= getClipSourceEnd(previousSegment) + tolerance
        const overlaps =
          getClipSourceEnd(segment) > getClipSourceStart(previousSegment) + tolerance &&
          getClipSourceStart(segment) < getClipSourceEnd(previousSegment) - tolerance

        return startsInside && endsInside && overlaps
      })
      .sort((left, right) => getClipSourceStart(left.segment) - getClipSourceStart(right.segment))

    if (matches.length === 0) {
      return
    }

    if (matches.length === 1) {
      assignedLabels.set(matches[0].nextIndex, baseLabel)
      return
    }

    matches.forEach(({ nextIndex }, splitIndex) => {
      assignedLabels.set(nextIndex, `${baseLabel}_${splitIndex + 1}`)
    })
  })

  return normalizedNextSegments.map((segment, index) => ({
    ...segment,
    label: assignedLabels.get(index) ?? segment.label,
  }))
}

function isTimelineUnedited(
  segments: ClipSegment[],
  videoDuration: number | null,
): boolean {
  if (!videoDuration || videoDuration <= 0 || segments.length !== 1) {
    return false
  }

  const [segment] = segments
  if (!segment) {
    return false
  }

  return (
    Math.abs(getClipSourceStart(segment)) < 0.001 &&
    Math.abs(getClipSourceEnd(segment) - videoDuration) < 0.001 &&
    getClipSourceRanges(segment).length === 1
  )
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
          ? 'Welcome to todayâ€™s research walkthrough.'
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

function silenceSegmentsFromKeys(
  items: Array<{ key: string; start: number; end: number }>,
  keys: string[],
): Array<{ start: number; end: number }> {
  if (keys.length === 0) {
    return []
  }

  const selected = new Set(keys)
  return items
    .filter((segment) => selected.has(segment.key))
    .map((segment) => ({
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

function normalizeCutRange(
  start: number,
  end: number,
  editedDuration: number,
): { start: number; end: number } {
  const safeDuration = Math.max(editedDuration, CUT_RANGE_MIN_GAP)
  const clampedStart = clamp(
    start,
    0,
    Math.max(0, safeDuration - CUT_RANGE_MIN_GAP),
  )
  const clampedEnd = clamp(end, clampedStart + CUT_RANGE_MIN_GAP, safeDuration)
  return {
    start: clampedStart,
    end: clampedEnd,
  }
}

interface TimelineSegmentLayout {
  segmentId: number
  duration: number
  globalStart: number
  globalEnd: number
  selectedStart: number | null
  selectedEnd: number | null
}

function buildFullCutRange(duration: number): { start: number; end: number } {
  return {
    start: 0,
    end: Math.max(CUT_RANGE_MIN_GAP, duration),
  }
}

function buildTimelineSegmentLayouts(
  segments: ClipSegment[],
  selectedSegmentIdSet: Set<number>,
): TimelineSegmentLayout[] {
  let globalOffset = 0
  let selectedOffset = 0

  return segments.map((segment) => {
    const duration = getClipDuration(segment)
    const isSelected = selectedSegmentIdSet.has(segment.id)
    const layout: TimelineSegmentLayout = {
      segmentId: segment.id,
      duration,
      globalStart: globalOffset,
      globalEnd: globalOffset + duration,
      selectedStart: isSelected ? selectedOffset : null,
      selectedEnd: isSelected ? selectedOffset + duration : null,
    }

    globalOffset += duration
    if (isSelected) {
      selectedOffset += duration
    }

    return layout
  })
}

function mapGlobalEditedTimeToSelectedTime(
  layouts: TimelineSegmentLayout[],
  globalEditedTime: number,
  editedDuration: number,
): number | null {
  if (layouts.length === 0) {
    return null
  }

  const safeGlobalTime = clamp(globalEditedTime, 0, editedDuration)
  let selectedOffset = 0

  for (const layout of layouts) {
    if (layout.selectedStart == null || layout.selectedEnd == null) {
      if (safeGlobalTime <= layout.globalEnd) {
        return selectedOffset
      }
      continue
    }

    if (safeGlobalTime <= layout.globalStart) {
      return layout.selectedStart
    }

    if (safeGlobalTime <= layout.globalEnd) {
      return layout.selectedStart + (safeGlobalTime - layout.globalStart)
    }

    selectedOffset = layout.selectedEnd
  }

  return selectedOffset
}

function mapSelectedEditedTimeToGlobalTime(
  layouts: TimelineSegmentLayout[],
  selectedEditedTime: number,
  selectedDuration: number,
): number {
  const selectedLayouts = layouts.filter(
    (layout) => layout.selectedStart != null && layout.selectedEnd != null,
  )

  if (selectedLayouts.length === 0) {
    return 0
  }

  const safeSelectedTime = clamp(selectedEditedTime, 0, selectedDuration)

  for (let index = 0; index < selectedLayouts.length; index += 1) {
    const layout = selectedLayouts[index]
    if (
      layout.selectedStart == null ||
      layout.selectedEnd == null
    ) {
      continue
    }

    const isLastSelectedLayout = index === selectedLayouts.length - 1
    if (safeSelectedTime <= layout.selectedEnd || isLastSelectedLayout) {
      return layout.globalStart + clamp(
        safeSelectedTime - layout.selectedStart,
        0,
        layout.duration,
      )
    }
  }

  return selectedLayouts[selectedLayouts.length - 1]?.globalEnd ?? 0
}

function getSegmentTimelineFrames(
  thumbnails: TimelineThumbnail[],
  segment: ClipSegment,
): TimelineThumbnail[] {
  if (thumbnails.length === 0) return []

  const frames = thumbnails.filter(
    (thumbnail) =>
      getClipSourceRanges(segment).some(
        (range) => thumbnail.time >= range.start && thumbnail.time < range.end,
      ),
  )

  if (frames.length > 0) {
    return frames
  }

  const nearest = thumbnails.reduce<TimelineThumbnail | null>((closest, thumbnail) => {
    if (closest == null) return thumbnail

    const thumbnailDistance = Math.min(
      Math.abs(thumbnail.time - getClipSourceStart(segment)),
      Math.abs(thumbnail.time - getClipSourceEnd(segment)),
    )
    const closestDistance = Math.min(
      Math.abs(closest.time - getClipSourceStart(segment)),
      Math.abs(closest.time - getClipSourceEnd(segment)),
    )

    return thumbnailDistance < closestDistance ? thumbnail : closest
  }, null)

  return nearest ? [nearest] : []
}

function buildOriginalTimelineSections(
  segments: ClipSegment[],
  totalDuration: number,
): OriginalTimelineSection[] {
  const safeDuration = Math.max(0, totalDuration)
  if (safeDuration <= 0) {
    return []
  }

  const sortedRanges = segments
    .flatMap((segment) => getClipSourceRanges(segment))
    .filter((range) => range.end > range.start)
    .sort((left, right) => left.start - right.start)

  const sections: OriginalTimelineSection[] = []
  let cursor = 0

  sortedRanges.forEach((range) => {
    const start = clamp(range.start, 0, safeDuration)
    const end = clamp(range.end, 0, safeDuration)

    if (start > cursor) {
      sections.push({
        kind: 'removed',
        start: cursor,
        end: start,
      })
    }

    if (end > start) {
      sections.push({
        kind: 'kept',
        start,
        end,
      })
      cursor = Math.max(cursor, end)
    }
  })

  if (cursor < safeDuration) {
    sections.push({
      kind: 'removed',
      start: cursor,
      end: safeDuration,
    })
  }

  return sections.filter((section) => section.end - section.start > 0.001)
}

function buildOriginalTimelineMarkers(
  segments: ClipSegment[],
  totalDuration: number,
): number[] {
  const safeDuration = Math.max(0, totalDuration)
  if (safeDuration <= 0) {
    return []
  }

  const seen = new Set<string>()

  return segments
    .slice(1)
    .map((segment) => clamp(getClipSourceStart(segment), 0, safeDuration))
    .filter((value) => value > 0 && value < safeDuration)
    .filter((value) => {
      const key = value.toFixed(3)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

function reorderSegmentsById(
  segments: ClipSegment[],
  draggedId: number,
  targetId: number,
): ReorderedSegmentsResult {
  if (draggedId === targetId) {
    return { segments, moved: false }
  }

  const draggedIndex = segments.findIndex((segment) => segment.id === draggedId)
  const targetIndex = segments.findIndex((segment) => segment.id === targetId)

  if (draggedIndex < 0 || targetIndex < 0) {
    return { segments, moved: false }
  }

  const nextSegments = [...segments]
  const [draggedSegment] = nextSegments.splice(draggedIndex, 1)
  nextSegments.splice(targetIndex, 0, draggedSegment)

  return {
    segments: nextSegments,
    moved: true,
  }
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
  const [areAIQuickActionsVisible, setAreAIQuickActionsVisible] = useState(true)
  const [aiMessages, setAiMessages] = useState<AIDraftMessage[]>([])
  const [aiPendingSuggestion, setAiPendingSuggestion] = useState<AIEditSuggestion | null>(
    null,
  )
  const [isApplyingAISuggestion, setIsApplyingAISuggestion] = useState(false)
  const [aiRequestStatus, setAiRequestStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle')
  const [aiResponseJson, setAiResponseJson] = useState<string>('')
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
  const [chapterNameDrafts, setChapterNameDrafts] = useState<Record<number, string>>({})
  const [chapterSummaryDrafts, setChapterSummaryDrafts] = useState<Record<number, string>>({})
  const [chapterThumbnailDrafts, setChapterThumbnailDrafts] = useState<
    Record<number, string | null>
  >({})
  const [sceneStatus, setSceneStatus] = useState<'idle' | 'pending'>('idle')
  const [segments, setSegments] = useState<ClipSegment[]>(
    relabelSegmentsForChapters(createInitialSegments(180)),
  )
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<number[]>([1])
  const [editorSessionId, setEditorSessionId] = useState<string | null>(null)
  const [editorStatus, setEditorStatus] = useState<EditorStatus>('idle')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [activeExportKind, setActiveExportKind] = useState<ExportKind | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [appendStatus, setAppendStatus] = useState<AppendStatus>('idle')
  const [mergeStatus, setMergeStatus] = useState<MergeStatus>('idle')
  const [timelineThumbnails, setTimelineThumbnails] = useState<TimelineThumbnail[]>([])
  const [waveformSamples, setWaveformSamples] = useState<number[]>([])
  const [timelineMediaReady, setTimelineMediaReady] = useState(false)
  const [isTimelineDragging, setIsTimelineDragging] = useState(false)
  const [activeCutHandle, setActiveCutHandle] = useState<CutHandle | null>(null)
  const [isArrangeModeEnabled, setIsArrangeModeEnabled] = useState(false)
  const [draggedSegmentId, setDraggedSegmentId] = useState<number | null>(null)
  const [dragOverSegmentId, setDragOverSegmentId] = useState<number | null>(null)
  const [timelineZoom, setTimelineZoom] = useState(1)
  const [history, setHistory] = useState<EditorHistoryEntry[]>([])
  const [redoHistory, setRedoHistory] = useState<EditorHistoryEntry[]>([])
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<WorkflowStepId>('')
  const [previewPlaybackMode, setPreviewPlaybackMode] =
    useState<PreviewPlaybackMode>('edited')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() =>
    readStoredCategories(),
  )
  const [newCategoryDraft, setNewCategoryDraft] = useState('')
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [doneActionKind, setDoneActionKind] = useState<DoneActionKind | null>(null)
  const [doneVideoTitleDraft, setDoneVideoTitleDraft] = useState('')
  const [doneCategoryDraft, setDoneCategoryDraft] = useState('')
  const [doneCourseDraft, setDoneCourseDraft] = useState(EXISTING_COURSE_OPTIONS[0])
  const [doneNewCourseNameDraft, setDoneNewCourseNameDraft] = useState('')
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false)
  const [editorVersions, setEditorVersions] = useState<EditorVersionInfo[]>([])
  const [versionsStatus, setVersionsStatus] =
    useState<'idle' | 'loading' | 'error'>('idle')
  const [versionsError, setVersionsError] = useState<string | null>(null)
  const [saveVersionStatus, setSaveVersionStatus] =
    useState<'idle' | 'saving' | 'error'>('idle')
  const [saveVersionError, setSaveVersionError] = useState<string | null>(null)
  const [deletingVersionName, setDeletingVersionName] = useState<string | null>(
    null,
  )
  const [switchingVersionName, setSwitchingVersionName] = useState<string | null>(
    null,
  )
  const [downloadingVersionName, setDownloadingVersionName] = useState<
    string | null
  >(null)
  const [cutRange, setCutRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 180,
  })
  const [isCutModeEnabled, setIsCutModeEnabled] = useState(false)

  const videoPreviewRef = useRef<VideoPreviewHandle | null>(null)
  const timelineScrollRef = useRef<HTMLDivElement | null>(null)
  const timelineTrackRef = useRef<HTMLDivElement | null>(null)
  const aiChatEndRef = useRef<HTMLDivElement | null>(null)
  const shouldCenterPlayheadAfterZoomRef = useRef(false)
  const subtitleUploadInputRef = useRef<HTMLInputElement | null>(null)
  const appendVideoInputRef = useRef<HTMLInputElement | null>(null)
  const previousWorkspaceViewRef = useRef<RightPanelView>('ai')
  const clipHotkeyNavigationSegmentIdRef = useRef<number | null>(null)

  const resetClipHotkeyNavigation = () => {
    clipHotkeyNavigationSegmentIdRef.current = null
  }

  const applyClipSelection = (
    nextSegments: ClipSegment[],
    nextSelectedIds: number[],
    nextActiveId: number | null,
  ) => {
    const orderedSelection = orderClipSelectionIds(nextSegments, nextSelectedIds)
    const resolvedActiveId =
      nextActiveId != null && orderedSelection.includes(nextActiveId)
        ? nextActiveId
        : orderedSelection[0] ?? nextSegments[0]?.id ?? null
    const normalizedSelection =
      orderedSelection.length > 0
        ? orderedSelection
        : resolvedActiveId != null
          ? [resolvedActiveId]
          : []

    setSelectedSegmentIds(normalizedSelection)
    setSelectedId(resolvedActiveId)
  }

  const selectSingleClip = (
    segmentId: number | null,
    nextSegments: ClipSegment[] = segments,
    options: { preserveClipHotkeyNavigation?: boolean } = {},
  ) => {
    if (!options.preserveClipHotkeyNavigation) {
      resetClipHotkeyNavigation()
    }

    applyClipSelection(
      nextSegments,
      segmentId != null ? [segmentId] : [],
      segmentId,
    )
  }

  useEffect(() => {
    if (!videoDuration || videoDuration <= 0) return
    if (editorSessionId) return
    const initialSegments = relabelSegmentsForChapters(
      createInitialSegments(videoDuration),
    )
    setSegments(initialSegments)
    setSelectedId(initialSegments[0]?.id ?? null)
    setSelectedSegmentIds(initialSegments[0] ? [initialSegments[0].id] : [])
    setHistory([])
    setRedoHistory([])
    setEditorError(null)
    setExportStatus('idle')
    setActiveExportKind(null)
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
    setActiveExportKind(null)
    setExportError(null)
    setSilenceSegments([])
    setSelectedSilenceSegmentKeys([])
    setStagedSilenceSegmentKeys([])
    setSilenceStatus('idle')
    setSilenceError(null)
    setSilenceNotice(null)
    setSelectedCategory('')
    setNewCategoryDraft('')
    setCutRange(buildFullCutRange(180))
  }, [preloadedVideoUrl])

  useEffect(() => {
    setCategoryOptions((prev) => mergeCategoryOptions(prev, selectedCategory))
  }, [selectedCategory])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      CATEGORY_STORAGE_KEY,
      JSON.stringify(categoryOptions),
    )
  }, [categoryOptions])

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
        await replaceEditorSessionSegments(
          editorSessionId,
          segments,
          selectedId,
        )
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

  useEffect(() => {
    if (!editorSessionId) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const session = await updateEditorSessionCategory(
          editorSessionId,
          selectedCategory,
        )

        if (!cancelled) {
          setSelectedCategory(session.category)
          setEditorError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setEditorError(
            error instanceof Error
              ? error.message
              : 'Could not update the video category.',
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [editorSessionId, selectedCategory])

  const orderedSelectedSegmentIds = orderClipSelectionIds(
    segments,
    selectedSegmentIds,
  )
  const selectedSegmentIdSet = new Set(orderedSelectedSegmentIds)
  const selectedSegments = segments.filter((segment) =>
    selectedSegmentIdSet.has(segment.id),
  )
  const selectedSegment =
    (selectedId != null
      ? segments.find((segment) => segment.id === selectedId) ?? null
      : null) ??
    selectedSegments[0] ??
    null
  const selectedIndex = selectedSegment
    ? segments.findIndex((segment) => segment.id === selectedSegment.id)
    : -1
  const selectedSegmentIndices = segments.reduce<number[]>((indices, segment, index) => {
    if (selectedSegmentIdSet.has(segment.id)) {
      indices.push(index)
    }
    return indices
  }, [])
  const selectedCutScopeKey = orderedSelectedSegmentIds.join(':')
  const hasSingleSelectedSegment = selectedSegments.length === 1
  const canMergeSelectedSegments =
    selectedSegmentIndices.length >= 2 &&
    selectedSegmentIndices[selectedSegmentIndices.length - 1] -
      selectedSegmentIndices[0] +
      1 ===
      selectedSegmentIndices.length

  const totalDuration =
    videoDuration && videoDuration > 0
      ? videoDuration
      : segments.length > 0
        ? Math.max(...segments.map((segment) => getClipSourceEnd(segment)))
        : 180
  const editedDuration = Math.max(
    0,
    segments.reduce((sum, segment) => sum + getClipDuration(segment), 0),
  )
  const segmentTimelineLayouts = useMemo(
    () => buildTimelineSegmentLayouts(segments, new Set(orderedSelectedSegmentIds)),
    [segments, selectedCutScopeKey],
  )
  const selectedTimelineLayouts = segmentTimelineLayouts.filter(
    (layout) => layout.selectedStart != null && layout.selectedEnd != null,
  )
  const selectedCutDuration =
    segmentTimelineLayouts.reduce(
      (duration, layout) =>
        layout.selectedEnd != null ? Math.max(duration, layout.selectedEnd) : duration,
      0,
    ) || 0
  const canCutSelectedSegments =
    selectedSegments.length > 0 && selectedCutDuration > CUT_RANGE_MIN_GAP
  const normalizedCutRange = normalizeCutRange(
    cutRange.start,
    cutRange.end,
    selectedCutDuration,
  )
  const cutRangeStartEditedTime = mapSelectedEditedTimeToGlobalTime(
    segmentTimelineLayouts,
    normalizedCutRange.start,
    selectedCutDuration,
  )
  const cutRangeEndEditedTime = mapSelectedEditedTimeToGlobalTime(
    segmentTimelineLayouts,
    normalizedCutRange.end,
    selectedCutDuration,
  )
  const cutRangeStartRatio =
    editedDuration > 0 ? cutRangeStartEditedTime / editedDuration : 0
  const cutRangeEndRatio =
    editedDuration > 0 ? cutRangeEndEditedTime / editedDuration : 1
  const timelinePlayheadSegmentIndex = segments.findIndex(
    (segment) => isSourceTimeInsideClip(segment, currentTime),
  )
  const activeTimelineSegmentIndex =
    timelinePlayheadSegmentIndex >= 0 ? timelinePlayheadSegmentIndex : selectedIndex
  const activeTimelineSegment =
    activeTimelineSegmentIndex >= 0 ? segments[activeTimelineSegmentIndex] : null
  const activeTimelineSegmentOffset =
    activeTimelineSegmentIndex > 0
      ? segments
          .slice(0, activeTimelineSegmentIndex)
          .reduce((sum, segment) => sum + getClipDuration(segment), 0)
      : 0
  const timelinePlayheadEditedTime = activeTimelineSegment
    ? clamp(
        activeTimelineSegmentOffset +
          mapSourceTimeToClipEditedOffset(activeTimelineSegment, currentTime),
        0,
        editedDuration,
      )
    : 0
  const timelinePlayheadRatio =
    editedDuration > 0 ? clamp(timelinePlayheadEditedTime / editedDuration, 0, 1) : 0
  const originalTimelineSections = useMemo(
    () => buildOriginalTimelineSections(segments, totalDuration),
    [segments, totalDuration],
  )
  const originalTimelineMarkers = useMemo(
    () => buildOriginalTimelineMarkers(segments, totalDuration),
    [segments, totalDuration],
  )
  const sourcePlayheadRatio =
    totalDuration > 0 ? clamp(currentTime / totalDuration, 0, 1) : 0

  useLayoutEffect(() => {
    if (!shouldCenterPlayheadAfterZoomRef.current) {
      return
    }

    shouldCenterPlayheadAfterZoomRef.current = false
    const scrollContainer = timelineScrollRef.current
    if (!scrollContainer) {
      return
    }

    const maxScrollLeft = Math.max(
      0,
      scrollContainer.scrollWidth - scrollContainer.clientWidth,
    )
    const playheadScrollLeft =
      timelinePlayheadRatio * scrollContainer.scrollWidth -
      scrollContainer.clientWidth / 2

    scrollContainer.scrollLeft = clamp(playheadScrollLeft, 0, maxScrollLeft)
  }, [timelinePlayheadRatio, timelineZoom])

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
      redoHistory.length > 0 ||
      Boolean(editorSessionId) ||
      Boolean(selectedCategory) ||
      subtitleSegments.length > 0 ||
      silenceSegments.length > 0 ||
      stagedSilenceSegmentKeys.length > 0
    )
  const workflowSteps = [
	    {
	      id: 'clean',
	      step: 'Step 1',
	      label: 'Clean',
	      tooltip: 'Use the toolbar below the video to cut, split, merge, delete, or arrange chapters.',
	      icon: Brush,
	    },
    {
	      id: 'polish',
	      step: 'Step 2',
	      label: 'Polish',
	      tooltip: 'Add subtitles or find quiet sections to improve the video.',
	      icon: Sparkles,
	    },
    {
	      id: 'chapters',
	      step: 'Step 3',
	      label: 'Chapters',
	      tooltip: 'Split the video into clear named chapters.',
	      icon: Clapperboard,
	    },
    {
	      id: 'course',
	      step: 'Step 4',
	      label: 'Course',
	      tooltip: 'Save, export, or add the finished video to a course.',
	      icon: BookOpen,
	    },
  ]

  const captureEditorState = (): EditorHistoryEntry => ({
    segments: segments.map((segment) => ({ ...segment })),
    selectedId,
    selectedIds: [...orderedSelectedSegmentIds],
    subtitleSegments: subtitleSegments.map((segment) => ({ ...segment })),
  })

  const pushHistory = () => {
    setHistory((prev) => [...prev.slice(-29), captureEditorState()])
    setRedoHistory([])
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
    setSelectedId(null)
    setSelectedSegmentIds([])
    setSubtitleSegments([])
    setSubtitleStatus('idle')
    setSubtitleError(null)
    setSubtitleTimingDrafts({})
    setChapterNameDrafts({})
    setSilenceStatus('idle')
    setSilenceError(null)
    setSilenceSegments([])
    setSelectedSilenceSegmentKeys([])
    setStagedSilenceSegmentKeys([])
	    setSilenceNotice(null)
	    previousWorkspaceViewRef.current = 'ai'
	    setRightPanelView('ai')
	    setActiveWorkflowStep('')
	    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    setIsArrangeModeEnabled(false)
    setDraggedSegmentId(null)
    setDragOverSegmentId(null)
    setHistory([])
    setRedoHistory([])
    setPreviewPlaybackMode('edited')
    setSelectedCategory('')
    setNewCategoryDraft('')
    setCutRange(buildFullCutRange(editedDuration || videoDuration || 180))
  }

  const restoreEditorState = async (
    state: EditorHistoryEntry,
    errorMessage: string,
  ) => {
    const localSegments = relabelSegmentsForChapters(state.segments)
    setSegments(localSegments)
    applyClipSelection(localSegments, state.selectedIds, state.selectedId)
    setSubtitleSegments(state.subtitleSegments)

    if (!editorSessionId) return

    try {
      setEditorStatus('syncing')
      const session = await replaceEditorSessionSegments(
        editorSessionId,
        state.segments,
        state.selectedId,
        selectedCategory,
      )
      const nextSegments = relabelSegmentsForChapters(session.segments)
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        session.selectedSegmentId != null
          ? [session.selectedSegmentId]
          : state.selectedIds,
        session.selectedSegmentId ?? state.selectedId,
      )
      setEditorStatus('ready')
      setEditorError(null)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(error instanceof Error ? error.message : errorMessage)
    }
  }

	  const handleUndo = async () => {
	    if (history.length === 0) return
	    setActiveWorkflowStep('clean')

    const previous = history[history.length - 1]
    setRedoHistory((prev) => [...prev.slice(-29), captureEditorState()])
    setHistory((prev) => prev.slice(0, -1))
    await restoreEditorState(previous, 'Could not restore the previous editor state.')
  }

  const handleRedo = async () => {
    if (redoHistory.length === 0) return
    setActiveWorkflowStep('clean')

    const next = redoHistory[redoHistory.length - 1]
    setHistory((prev) => [...prev.slice(-29), captureEditorState()])
    setRedoHistory((prev) => prev.slice(0, -1))
    await restoreEditorState(next, 'Could not redo the editor state.')
  }

  const handleSeek = (timeInSeconds: number) => {
    resetClipHotkeyNavigation()
    setPreviewPlaybackMode('edited')
    const safeTime = Math.max(0, Math.min(timeInSeconds, totalDuration))
    const containingSegment = segments.find(
      (segment) => isSourceTimeInsideClip(segment, safeTime),
    )
    if (containingSegment) {
      setSelectedId(containingSegment.id)
      setSelectedSegmentIds((prev) =>
        prev.includes(containingSegment.id) && prev.length > 1
          ? prev
          : [containingSegment.id],
      )
    }
    videoPreviewRef.current?.seekTo(safeTime)
    setCurrentTime(safeTime)
  }

  const handleSeekOriginal = (timeInSeconds: number, shouldPlay = false) => {
    resetClipHotkeyNavigation()
    const safeTime = Math.max(0, Math.min(timeInSeconds, totalDuration))
    setPreviewPlaybackMode('original')
    videoPreviewRef.current?.seekTo(safeTime)
    setCurrentTime(safeTime)

    if (shouldPlay) {
      videoPreviewRef.current?.play()
    }
  }

  const seekEditedTimelineToTime = (editedTime: number) => {
    if (segments.length === 0 || editedDuration <= 0) {
      handleSeek(editedTime)
      return
    }

    const safeEditedTime = clamp(editedTime, 0, editedDuration)
    let consumedDuration = 0

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]
      const segmentDuration = getClipDuration(segment)
      const nextConsumedDuration = consumedDuration + segmentDuration

      if (safeEditedTime <= nextConsumedDuration || index === segments.length - 1) {
        const nextTime = mapClipEditedOffsetToSourceTime(
          segment,
          clamp(safeEditedTime - consumedDuration, 0, segmentDuration),
        )
        handleSeek(nextTime)
        return
      }

      consumedDuration = nextConsumedDuration
    }
  }

  const seekTimelineFromClientX = (clientX: number) => {
    if (!timelineTrackRef.current) return
    const bounds = timelineTrackRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1)

    if (segments.length === 0 || editedDuration <= 0) {
      handleSeek(ratio * totalDuration)
      return
    }

    seekEditedTimelineToTime(ratio * editedDuration)
  }

	  const handleActivateCutMode = () => {
	    setActiveWorkflowStep('clean')
	    if (isCutModeEnabled) {
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
      return
    }

    setEditorError(null)
    setCutRange(buildFullCutRange(selectedCutDuration))
    setIsArrangeModeEnabled(false)
    setDraggedSegmentId(null)
    setDragOverSegmentId(null)
    setIsCutModeEnabled(true)
    setActiveCutHandle(null)
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
	      previousWorkspaceViewRef.current = 'subtitles'
	      setRightPanelView('subtitles')
	      setActiveWorkflowStep('polish')
      setIsCutModeEnabled(false)
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

  const openSilenceReviewPanel = () => {
    setActiveWorkflowStep('polish')
    previousWorkspaceViewRef.current = 'silence'
    setRightPanelView('silence')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    setIsRightPanelCollapsed(false)
  }

  const handleDetectSilence = async () => {
    openSilenceReviewPanel()

    const isUneditedTimeline = isTimelineUnedited(segments, videoDuration)
    const silenceDetectionOptions = {
      noiseThresholdDb: -35,
      minSilenceDuration: 0.6,
      minSegmentDuration: 0.25,
    }

    if (isUneditedTimeline) {
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
        const detection = await detectSilenceFromVideo(
          videoFile,
          silenceDetectionOptions,
        )
        const nextSilenceSegments = detection.silenceSegments
        setSilenceSegments(nextSilenceSegments)
        setSelectedSilenceSegmentKeys([])
        setStagedSilenceSegmentKeys([])
        setSilenceStatus('success')
        setSilenceNotice(
          nextSilenceSegments.length > 0
            ? 'Review the detected silence ranges across the full video, then select the ones you want removed from the edit.'
            : 'No long silence ranges were detected across the full video.',
        )
      } catch (error) {
        setSilenceStatus('error')
        setSilenceError(
          error instanceof Error
            ? error.message
            : 'Silence detection failed unexpectedly.',
        )
      }
      return
    }

    if (segments.length === 0) {
      setSilenceStatus('error')
      setSilenceError(
        'Upload a local video file before running silence detection.',
      )
      return
    }

    const session = await ensureEditorSession()
    if (!session) return

    setSilenceStatus('processing')
    setSilenceError(null)
    setSilenceNotice(null)

    try {
      const syncedSession = await replaceEditorSessionSegments(
        session.sessionId,
        segments,
        selectedId,
      )
      const detection = await detectSilenceInEditorSession(
        syncedSession.sessionId,
        silenceDetectionOptions,
      )
      let nextSilenceSegments = detection.silenceSegments
      if (nextSilenceSegments.length === 0) {
        const videoFile = await ensureVideoFile()
        if (videoFile) {
          const sourceDetection = await detectSilenceFromVideo(
            videoFile,
            silenceDetectionOptions,
          )
          nextSilenceSegments = sourceDetection.silenceSegments
            .map((silence) => {
              for (const segment of segments) {
                const start = Math.max(silence.start, segment.start)
                const end = Math.min(silence.end, segment.end)
                if (end - start >= silenceDetectionOptions.minSilenceDuration) {
                  return { start, end }
                }
              }
              return null
            })
            .filter((segment): segment is { start: number; end: number } => segment != null)
        }
      }
      setSilenceSegments(nextSilenceSegments)
      setSelectedSilenceSegmentKeys([])
      setStagedSilenceSegmentKeys([])
      setSilenceStatus('success')
      setSilenceNotice(
        nextSilenceSegments.length > 0
          ? 'Review the detected silence ranges across the current edit, then select the ones you want removed from the edit.'
          : 'No long silence ranges were detected across the current edit.',
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
    if (rightPanelView === 'ai' && !isRightPanelCollapsed) {
      setIsRightPanelCollapsed(true)
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
      return
    }

	    previousWorkspaceViewRef.current = 'ai'
	    setRightPanelView('ai')
	    setActiveWorkflowStep('')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    setIsRightPanelCollapsed(false)
  }

	  const handleOpenSubtitlesPanel = () => {
	    setActiveWorkflowStep('polish')
	    if (rightPanelView === 'subtitles' && !isRightPanelCollapsed) {
      setIsRightPanelCollapsed(true)
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
      return
    }

    previousWorkspaceViewRef.current = 'subtitles'
    setRightPanelView('subtitles')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    setIsRightPanelCollapsed(false)
    setSubtitleError(null)
  }

	  const handleOpenChaptersPanel = () => {
	    setActiveWorkflowStep('chapters')
	    if (rightPanelView === 'chapters' && !isRightPanelCollapsed) {
      setIsRightPanelCollapsed(true)
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
      return
    }

    previousWorkspaceViewRef.current = 'chapters'
    setRightPanelView('chapters')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    setIsRightPanelCollapsed(false)
    setSceneStatus('pending')
  }

	  const handleOpenDonePanel = () => {
	    setActiveWorkflowStep('course')
	    if (rightPanelView === 'done' && !isRightPanelCollapsed) {
      setIsRightPanelCollapsed(true)
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
      return
    }

    previousWorkspaceViewRef.current = 'done'
    setRightPanelView('done')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
	    setIsRightPanelCollapsed(false)
	  }

	  const handleWorkflowStepClick = (stepId: WorkflowStepId) => {
	    setActiveWorkflowStep(stepId)
	    setIsCutModeEnabled(false)
	    setActiveCutHandle(null)
	    setIsRightPanelCollapsed(true)

	    if (stepId === 'clean') {
	      setEditorError(null)
	      setCutRange(buildFullCutRange(selectedCutDuration))
	    }
	  }

	  const handleToggleRightPanelCollapsed = () => {
	    if (isRightPanelCollapsed) {
	      if (!rightPanelView) {
	        setRightPanelView('ai')
	      }
	      setIsRightPanelCollapsed(false)
	      return
	    }

	    setIsRightPanelCollapsed(true)
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

  const handleDeleteSelectedSilences = async () => {
    if (selectedSilenceSegmentKeys.length === 0) {
      setSilenceError(
        'Select at least one silence range to delete it from the edit.',
      )
      return
    }

    const session = await ensureEditorSession()
    if (!session) return

    const selectedSilenceKeySet = new Set(selectedSilenceSegmentKeys)
    const selectedSilences = silenceSegmentsFromKeys(
      silenceReviewItems,
      selectedSilenceSegmentKeys,
    )
    const remainingSilences = silenceReviewItems
      .filter((segment) => !selectedSilenceKeySet.has(segment.key))
      .map(({ key: _key, index: _index, ...segment }) => segment)

    try {
      setEditorStatus('syncing')
      const previousState = captureEditorState()
      const nextSession = await deleteSilenceRangesFromEditorSession(
        session.sessionId,
        selectedSilences,
      )

      const nextSegments = preserveChapterLabels(segments, nextSession.segments)
      setHistory((prev) => [...prev.slice(-29), previousState])
      setRedoHistory([])
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        nextSession.selectedSegmentId != null
          ? [nextSession.selectedSegmentId]
          : [],
        nextSession.selectedSegmentId ?? nextSession.segments[0]?.id ?? null,
      )
      setEditorStatus('ready')
      setEditorError(null)
      setChapterNameDrafts({})
      setSilenceError(null)
      setSilenceSegments(remainingSilences)
      setSelectedSilenceSegmentKeys([])
      setStagedSilenceSegmentKeys([])
      setSilenceStatus(remainingSilences.length > 0 ? 'success' : 'idle')
      setSilenceNotice(
        remainingSilences.length > 0
          ? `${selectedSilences.length} silence range${
              selectedSilences.length === 1 ? '' : 's'
            } deleted. ${remainingSilences.length} silence range${
              remainingSilences.length === 1 ? '' : 's'
            } still available to review.`
          : `${selectedSilences.length} silence range${
              selectedSilences.length === 1 ? '' : 's'
            } deleted from the current edit.`,
      )
      const nextSeekTime = nextSession.segments[0]?.start ?? 0
      videoPreviewRef.current?.seekTo(nextSeekTime)
      setCurrentTime(nextSeekTime)
    } catch (error) {
      setEditorStatus('error')
      setSilenceError(
        error instanceof Error
          ? error.message
          : 'Could not delete the selected silence ranges.',
      )
    }
  }

  const updateCutHandle = (handle: CutHandle, editedTime: number) => {
    setCutRange((prev) => {
      const currentRange = normalizeCutRange(
        prev.start,
        prev.end,
        selectedCutDuration,
      )

      if (handle === 'start') {
        return {
          start: clamp(
            editedTime,
            0,
            Math.max(0, currentRange.end - CUT_RANGE_MIN_GAP),
          ),
          end: currentRange.end,
        }
      }

      return {
        start: currentRange.start,
        end: clamp(
          editedTime,
          currentRange.start + CUT_RANGE_MIN_GAP,
          Math.max(selectedCutDuration, CUT_RANGE_MIN_GAP),
        ),
      }
    })
  }

  const updateCutHandleFromClientX = (handle: CutHandle, clientX: number) => {
    if (
      !timelineTrackRef.current ||
      editedDuration <= 0 ||
      selectedCutDuration <= 0
    ) {
      return
    }

    const bounds = timelineTrackRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const globalEditedTime = ratio * editedDuration
    const selectedEditedTime = mapGlobalEditedTimeToSelectedTime(
      segmentTimelineLayouts,
      globalEditedTime,
      editedDuration,
    )

    if (selectedEditedTime == null) {
      return
    }

    updateCutHandle(handle, selectedEditedTime)
  }

  const beginCutTimelineInteraction = (clientX: number) => {
    if (
      !timelineTrackRef.current ||
      editedDuration <= 0 ||
      selectedCutDuration <= 0
    ) {
      return
    }

    const bounds = timelineTrackRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const editedTime = mapGlobalEditedTimeToSelectedTime(
      segmentTimelineLayouts,
      ratio * editedDuration,
      editedDuration,
    )

    if (editedTime == null) {
      return
    }

    const nextHandle: CutHandle =
      Math.abs(editedTime - normalizedCutRange.start) <=
      Math.abs(editedTime - normalizedCutRange.end)
        ? 'start'
        : 'end'

    setActiveCutHandle(nextHandle)
    updateCutHandle(nextHandle, editedTime)
  }

  const handleCutVideo = async () => {
    if (segments.length === 0) {
      setEditorError('Upload a video before cutting the timeline.')
      return
    }

    if (selectedSegments.length === 0 || selectedCutDuration <= 0) {
      setEditorError('Select at least one clip before cutting.')
      return
    }

    const session = await ensureEditorSession()
    if (!session) return

    try {
      setEditorStatus('syncing')
      const previousState = captureEditorState()
      const nextSession = await cutEditorSessionToRange(
        session.sessionId,
        normalizedCutRange.start,
        normalizedCutRange.end,
        orderedSelectedSegmentIds,
      )

      setHistory((prev) => [...prev.slice(-29), previousState])
      setRedoHistory([])
      const nextSegments = preserveChapterLabels(segments, nextSession.segments)
      setEditorError(null)
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        nextSession.selectedSegmentId != null
          ? [nextSession.selectedSegmentId]
          : [],
        nextSession.selectedSegmentId ?? nextSession.segments[0]?.id ?? null,
      )
      const nextSelectedIds =
        nextSession.selectedSegmentId != null
          ? [nextSession.selectedSegmentId]
          : []
      const nextSelectedDuration = nextSegments.reduce((sum, segment) => {
        if (!nextSelectedIds.includes(segment.id)) {
          return sum
        }

        return sum + getClipDuration(segment)
      }, 0)
      setCutRange(buildFullCutRange(nextSelectedDuration))

      const nextSeekTime =
        nextSegments.find((segment) => nextSelectedIds.includes(segment.id))?.start ??
        nextSegments[0]?.start ??
        0
      videoPreviewRef.current?.seekTo(nextSeekTime)
      setCurrentTime(nextSeekTime)
      setEditorStatus('ready')
      setChapterNameDrafts({})
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not cut the selected timeline range.',
      )
    }
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
        category: selectedCategory,
        segments,
      }
    }

    try {
      setEditorStatus('syncing')
      const session = await createEditorSessionFromVideo(videoFile)
      const nextSegments = relabelSegmentsForChapters(session.segments)
      setEditorSessionId(session.sessionId)
      setSelectedCategory(session.category || selectedCategory)
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        session.selectedSegmentId != null ? [session.selectedSegmentId] : [],
        session.selectedSegmentId ?? nextSegments[0]?.id ?? null,
      )
      setEditorStatus('ready')
      setEditorError(null)
      setChapterNameDrafts({})
      return {
        ...session,
        segments: nextSegments,
      }
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
    setActiveWorkflowStep('clean')
    if (!selectedSegment || !hasSingleSelectedSegment) return
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

      const nextSegments = preserveChapterLabels(segments, nextSession.segments)
      setHistory((prev) => [...prev.slice(-29), previousState])
      setRedoHistory([])
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        nextSession.selectedSegmentId != null
          ? [nextSession.selectedSegmentId]
          : [],
        nextSession.selectedSegmentId ??
          nextSegments[0]?.id ??
          selectedSegment.id,
      )
      setEditorStatus('ready')
      setEditorError(null)
      setChapterNameDrafts({})
      handleSeek(playhead)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not split the selected chapter.',
      )
    }
  }

  const handleTrimStart = () => {
    if (!selectedSegment || !hasSingleSelectedSegment) return
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
    if (!selectedSegment || !hasSingleSelectedSegment) return
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

  const handleMergeSelectedClips = async () => {
    setActiveWorkflowStep('clean')
    if (!canMergeSelectedSegments) return

    const session = await ensureEditorSession()
    if (!session) return

    try {
      setMergeStatus('processing')
      setEditorStatus('syncing')
      setEditorError(null)
      const previousState = captureEditorState()

      const nextSession = await mergeEditorSessionSegments(
        session.sessionId,
        orderedSelectedSegmentIds,
      )
      const nextSegments = preserveChapterLabels(segments, nextSession.segments)
      const nextSelectedSegment =
        (nextSession.selectedSegmentId != null
          ? nextSegments.find(
              (segment) => segment.id === nextSession.selectedSegmentId,
            ) ?? null
          : null) ?? nextSegments[0] ?? null

      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        nextSelectedSegment ? [nextSelectedSegment.id] : [],
        nextSelectedSegment?.id ?? null,
      )
      const nextSeekTime = nextSelectedSegment
        ? getClipSourceStart(nextSelectedSegment)
        : 0
      videoPreviewRef.current?.seekTo(nextSeekTime)
      setCurrentTime(nextSeekTime)
      setHistory((prev) => [...prev.slice(-29), previousState])
      setRedoHistory([])
      setEditorStatus('ready')
      setIsPlaying(false)
      setSilenceStatus('idle')
      setSilenceError(null)
      setSilenceSegments([])
      setSelectedSilenceSegmentKeys([])
      setStagedSilenceSegmentKeys([])
      setSilenceNotice(
        'Run silence detection again if you want to review the merged timeline.',
      )
      setChapterNameDrafts({})
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        error instanceof Error
          ? error.message
          : 'Could not merge the selected chapters.',
      )
    } finally {
      setMergeStatus('idle')
    }
  }

  const handleDeleteSelectedClip = () => {
    setActiveWorkflowStep('clean')
    if (!selectedSegment || !hasSingleSelectedSegment) return
    pushHistory()

    let nextSelection: number | null = selectedSegment.id
    setSegments((prev) => {
      const index = prev.findIndex((segment) => segment.id === selectedSegment.id)
      const filtered = prev.filter((segment) => segment.id !== selectedSegment.id)
      if (filtered.length === 0) {
        nextSelection = null
        return []
      }

      const nextIndex = Math.min(index, filtered.length - 1)
      const nextSegment = filtered[nextIndex]
      nextSelection = nextSegment.id
      return relabelSegmentsForChapters(filtered)
    })
    setChapterNameDrafts((prev) => {
      const next = { ...prev }
      delete next[selectedSegment.id]
      return next
    })

    if (nextSelection != null) {
      selectSingleClip(nextSelection)
      const nextSegment = segments.find((segment) => segment.id === nextSelection)
      if (nextSegment) {
        handleSeek(nextSegment.start)
      }
      return
    }

    applyClipSelection([], [], null)
  }

  const handleTimelineClipSelection = (
    segmentId: number,
    options: { extendSelection?: boolean; toggleSelection?: boolean } = {},
  ) => {
    resetClipHotkeyNavigation()

    const anchorId =
      selectedId ??
      orderedSelectedSegmentIds[orderedSelectedSegmentIds.length - 1] ??
      segmentId

    let nextSelectedIds: number[]

    if (options.extendSelection) {
      const rangeIds = getClipSelectionRangeIds(segments, anchorId, segmentId)
      if (options.toggleSelection) {
        nextSelectedIds = orderClipSelectionIds(segments, [
          ...orderedSelectedSegmentIds,
          ...rangeIds,
        ])
      } else {
        nextSelectedIds = rangeIds
      }
    } else if (options.toggleSelection) {
      const nextSelectedIdSet = new Set(orderedSelectedSegmentIds)
      if (nextSelectedIdSet.has(segmentId) && nextSelectedIdSet.size > 1) {
        nextSelectedIdSet.delete(segmentId)
      } else {
        nextSelectedIdSet.add(segmentId)
      }
      nextSelectedIds = orderClipSelectionIds(
        segments,
        Array.from(nextSelectedIdSet),
      )
    } else {
      nextSelectedIds = [segmentId]
    }

    applyClipSelection(segments, nextSelectedIds, segmentId)
  }

  const handleToggleArrangeMode = () => {
    setActiveWorkflowStep('clean')
    const nextIsEnabled = !isArrangeModeEnabled
    if (nextIsEnabled) {
      setIsCutModeEnabled(false)
      setActiveCutHandle(null)
    }
    setIsArrangeModeEnabled(nextIsEnabled)
    setDraggedSegmentId(null)
    setDragOverSegmentId(null)
    setEditorError(null)
  }

  const handleReorderSegment = (sourceId: number, targetId: number) => {
    const result = reorderSegmentsById(segments, sourceId, targetId)
    if (!result.moved) {
      return
    }

    pushHistory()
    setSegments(result.segments)
    applyClipSelection(result.segments, selectedSegmentIds, selectedId)
    setPreviewPlaybackMode('edited')
    setEditorError(null)
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

  const getChapterNameDraft = (segment: ClipSegment, index: number): string =>
    chapterNameDrafts[segment.id] ?? normalizeSegmentLabel(segment.label, index)

  const handleChapterNameDraftChange = (segmentId: number, value: string) => {
    setChapterNameDrafts((prev) => ({
      ...prev,
      [segmentId]: value,
    }))
  }

  const handleChapterNameDraftCommit = (segment: ClipSegment, index: number) => {
    const draft = chapterNameDrafts[segment.id]
    if (draft == null) {
      return
    }

    const nextLabel = draft.trim() || getDefaultChapterLabel(index)
    if (nextLabel === segment.label) {
      setChapterNameDrafts((prev) => {
        const next = { ...prev }
        delete next[segment.id]
        return next
      })
      return
    }

    pushHistory()
    setSegments((prev) =>
      prev.map((current) =>
        current.id === segment.id ? { ...current, label: nextLabel } : current,
      ),
    )
    setChapterNameDrafts((prev) => {
      const next = { ...prev }
      delete next[segment.id]
      return next
    })
  }

  const handleExportSubtitle = (format: 'srt' | 'vtt') => {
    if (subtitleSegments.length === 0) return

    const baseName = selectedVideoFile?.name || 'vidversity-subtitles'
    downloadSubtitleFile(subtitleSegments, baseName, format)
  }

  const downloadRenderedVideo = (rendered: { blob: Blob; fileName: string }) => {
    const url = URL.createObjectURL(rendered.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = rendered.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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

  const handleExportSelectedClip = async () => {
    if (!selectedSegment || !hasSingleSelectedSegment) {
      setExportError(
        selectedSegments.length > 1
          ? 'Select a single chapter before exporting it.'
          : 'Select a chapter in the timeline before exporting it.',
      )
      return
    }

    const session = await ensureEditorSession()
    if (!session) return

    try {
      setExportStatus('processing')
      setActiveExportKind('clip')
      setExportError(null)

      const syncedSession = await replaceEditorSessionSegments(
        session.sessionId,
        segments,
        selectedId,
        selectedCategory,
      )
      const rendered = await exportEditorSessionVideo(syncedSession.sessionId, {
        segments: [selectedSegment],
        fileNameSuffix: selectedSegment.label || 'chapter',
      })
      downloadRenderedVideo(rendered)
      setExportStatus('idle')
      setActiveExportKind(null)
    } catch (error) {
      setExportStatus('error')
      setActiveExportKind(null)
      setExportError(
        error instanceof Error
          ? error.message
          : 'Could not export the selected chapter.',
      )
    }
  }

  const handleExportVideo = async () => {
    const session = await ensureEditorSession()
    if (!session) return

    try {
      setExportStatus('processing')
      setActiveExportKind('video')
      setExportError(null)

      const syncedSession = await replaceEditorSessionSegments(
        session.sessionId,
        segments,
        selectedId,
        selectedCategory,
      )

      const rendered = await exportEditorSessionVideo(syncedSession.sessionId)
      downloadRenderedVideo(rendered)

      if (subtitleSegments.length > 0) {
        const remappedSubtitles = remapSubtitlesToEditedTimeline(
          subtitleSegments,
          syncedSession.segments,
        )
        if (remappedSubtitles.length > 0) {
          const baseName = rendered.fileName.replace(/\.mp4$/i, '')
          downloadSubtitleFile(remappedSubtitles, baseName, 'srt')
        }
      }

      setExportStatus('idle')
      setActiveExportKind(null)
    } catch (error) {
      setExportStatus('error')
      setActiveExportKind(null)
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
	    setActiveWorkflowStep('clean')
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
      setCutRange(buildFullCutRange(nextSession.duration))
      setCurrentTime(0)
      const nextSegments = preserveChapterLabels(segments, nextSession.segments)
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        nextSession.selectedSegmentId != null
          ? [nextSession.selectedSegmentId]
          : nextSegments.at(-1)?.id != null
            ? [nextSegments.at(-1)!.id]
            : [],
        nextSession.selectedSegmentId ??
          nextSegments.at(-1)?.id ??
          selectedId,
      )
      setEditorSessionId(nextSession.sessionId)
      setSelectedCategory(nextSession.category)
      setChapterNameDrafts({})
      setEditorStatus('ready')
      setIsPlaying(false)
      setHistory([])
      setRedoHistory([])
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
        `${file.name} was added to the end of the current timeline. Regenerate subtitles or silence detection if you want those tools to include the new section.`,
      )
      previousWorkspaceViewRef.current = 'ai'
      setRightPanelView('ai')
      setIsCutModeEnabled(false)
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

  const handleCategorySelect = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setIsCreateCategoryModalOpen(true)
      return
    }

    const nextCategory = value === DEFAULT_CATEGORY_VALUE ? '' : value
    setSelectedCategory(nextCategory)
    setEditorError(null)
  }

  const handleCreateCategory = () => {
    const nextCategory = normalizeCategoryName(newCategoryDraft)
    if (!nextCategory) {
      return
    }

    setCategoryOptions((prev) => mergeCategoryOptions(prev, nextCategory))
    setSelectedCategory(nextCategory)
    setDoneCategoryDraft(nextCategory)
    setNewCategoryDraft('')
    setIsCreateCategoryModalOpen(false)
    setEditorError(null)
  }

  const getDoneActionLabel = (action: DoneActionKind): string => {
    if (action === 'save-draft') return 'Save Draft'
    if (action === 'archive-video') return 'Archive Video'
    if (action === 'add-existing-course') return 'Add Video to Existing Course'
    return 'Add Video to New Course'
  }

  const getDoneActionConfirmLabel = (action: DoneActionKind): string => {
    if (action === 'save-draft') return 'Save'
    if (action === 'archive-video') return 'Archive'
    return 'Add'
  }

  const handleOpenDoneActionModal = (action: DoneActionKind) => {
    setDoneActionKind(action)
    setDoneVideoTitleDraft(
      getVideoTitleFromSource(selectedVideoFile, videoSourceUrl, preloadedVideoUrl),
    )
    setDoneCategoryDraft(selectedCategory)
    setDoneCourseDraft(EXISTING_COURSE_OPTIONS[0])
    setDoneNewCourseNameDraft('')
  }

  const handleCloseDoneActionModal = () => {
    setDoneActionKind(null)
    setDoneVideoTitleDraft('')
    setDoneCategoryDraft('')
    setDoneCourseDraft(EXISTING_COURSE_OPTIONS[0])
    setDoneNewCourseNameDraft('')
  }

  const handleDoneActionCategorySelect = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setIsCreateCategoryModalOpen(true)
      return
    }

    setDoneCategoryDraft(value === DEFAULT_CATEGORY_VALUE ? '' : value)
  }

  const handleSubmitDoneAction = () => {
    if (!doneActionKind || typeof window === 'undefined') {
      return
    }

    const nextTitle =
      doneVideoTitleDraft.trim() ||
      getVideoTitleFromSource(selectedVideoFile, videoSourceUrl, preloadedVideoUrl)
    const nextCategory = normalizeCategoryName(doneCategoryDraft)
    const record = {
      action: doneActionKind,
      actionLabel: getDoneActionLabel(doneActionKind),
      title: nextTitle,
      category: nextCategory,
      course: doneActionKind === 'add-existing-course' ? doneCourseDraft : '',
      newCourseName:
        doneActionKind === 'add-new-course'
          ? doneNewCourseNameDraft.trim()
          : '',
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(DONE_METADATA_STORAGE_KEY, JSON.stringify(record))
    setSelectedCategory(nextCategory)
    setCategoryOptions((prev) => mergeCategoryOptions(prev, nextCategory))
    handleCloseDoneActionModal()
  }

  const formatVersionDialogError = (
    error: unknown,
    fallbackMessage: string,
  ): string => {
    const rawMessage = error instanceof Error ? error.message : fallbackMessage
    const message = rawMessage.trim()

    if (
      /route not found|not support|cannot (save|download|delete|list|switch).*version/i.test(
        message,
      )
    ) {
      return 'The subtitle server is running, but this route is unavailable. Restart the server with the latest code (`npm run subtitles:server`).'
    }

    if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return 'Network appears offline. Reconnect and try again.'
      }
      return 'Cannot reach the local subtitle server at http://127.0.0.1:8787. Start it with `npm run subtitles:server` and try again.'
    }

    if (/ECONNREFUSED|ENOTFOUND|ERR_CONNECTION_REFUSED/i.test(message)) {
      return 'Could not connect to the local subtitle server. Make sure it is running on port 8787.'
    }

    return message.length > 0 ? message : fallbackMessage
  }

  const loadEditorVersions = async (sessionId: string) => {
    setVersionsStatus('loading')
    setVersionsError(null)
    try {
      const list = await listEditorSessionVersions(sessionId)
      setEditorVersions(list)
      setVersionsStatus('idle')
    } catch (error) {
      setVersionsStatus('error')
      setVersionsError(
        formatVersionDialogError(error, 'Could not load saved versions.'),
      )
    }
  }

  const handleOpenVersionsModal = async () => {
    setSaveVersionStatus('idle')
    setSaveVersionError(null)
    setDeletingVersionName(null)
    setSwitchingVersionName(null)
    setDownloadingVersionName(null)
    setIsVersionsModalOpen(true)

    const session = await ensureEditorSession()
    if (!session) {
      setVersionsStatus('error')
      setVersionsError(
        'Upload a video to start a session before viewing saved versions.',
      )
      return
    }
    await loadEditorVersions(session.sessionId)
  }

  const handleCloseVersionsModal = () => {
    setIsVersionsModalOpen(false)
    setSaveVersionStatus('idle')
    setSaveVersionError(null)
    setVersionsError(null)
    setDeletingVersionName(null)
    setSwitchingVersionName(null)
    setDownloadingVersionName(null)
  }

  const handleSaveCurrentVersion = async () => {
    const session = await ensureEditorSession()
    if (!session) return

    try {
      setSaveVersionStatus('saving')
      setSaveVersionError(null)

      const syncedSession = await replaceEditorSessionSegments(
        session.sessionId,
        segments,
        selectedId,
        selectedCategory,
      )
      const result = await saveEditorSessionVersion(syncedSession.sessionId, {
        segments,
        subtitles: subtitleSegments,
      })
      setEditorVersions(result.versions)
      setSaveVersionStatus('idle')
    } catch (error) {
      setSaveVersionStatus('error')
      setSaveVersionError(
        formatVersionDialogError(
          error,
          'Could not save the current edit as a new version.',
        ),
      )
    }
  }

  const handleSwitchEditorVersion = async (versionName: string) => {
    if (!editorSessionId) return
    try {
      setSwitchingVersionName(versionName)
      setVersionsError(null)
      setEditorStatus('syncing')
      setEditorError(null)

      const result = await switchEditorSessionVersion(editorSessionId, versionName)
      const sourceFile = await downloadEditorSessionSourceFile(result.session.sessionId)
      const sourceUrl = URL.createObjectURL(sourceFile)
      const nextSegments = relabelSegmentsForChapters(result.session.segments)
      const nextSelectedId = result.session.selectedSegmentId ?? nextSegments[0]?.id ?? null

      setSelectedVideoFile(sourceFile)
      setVideoSourceUrl(sourceUrl)
      setVideoDuration(result.session.duration)
      setCutRange(buildFullCutRange(result.session.duration))
      setCurrentTime(0)
      setSegments(nextSegments)
      applyClipSelection(
        nextSegments,
        nextSelectedId != null ? [nextSelectedId] : [],
        nextSelectedId,
      )
      setEditorSessionId(result.session.sessionId)
      setSelectedCategory(result.session.category)
      setChapterNameDrafts({})
      setChapterSummaryDrafts({})
      setChapterThumbnailDrafts({})
      setEditorVersions(result.versions)
      setIsPlaying(false)
      setHistory([])
      setRedoHistory([])
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
        'Switched to the selected source version. Regenerate subtitles or silence detection for this version.',
      )
      setEditorStatus('ready')
      videoPreviewRef.current?.pause()
      videoPreviewRef.current?.seekTo(0)
    } catch (error) {
      setEditorStatus('error')
      setEditorError(
        formatVersionDialogError(
          error,
          'Could not switch to the selected version.',
        ),
      )
      setVersionsError(
        formatVersionDialogError(
          error,
          'Could not switch to the selected version.',
        ),
      )
    } finally {
      setSwitchingVersionName(null)
    }
  }

  const handleDeleteEditorVersion = async (versionName: string) => {
    if (!editorSessionId) return
    try {
      setDeletingVersionName(versionName)
      setVersionsError(null)
      const list = await deleteEditorSessionVersion(
        editorSessionId,
        versionName,
      )
      setEditorVersions(list)
    } catch (error) {
      setVersionsError(
        formatVersionDialogError(error, 'Could not delete the selected version.'),
      )
    } finally {
      setDeletingVersionName(null)
    }
  }

  const handleDownloadEditorVersion = async (versionName: string) => {
    if (!editorSessionId) return
    try {
      setDownloadingVersionName(versionName)
      setVersionsError(null)
      const rendered = await downloadEditorSessionVersion(
        editorSessionId,
        versionName,
      )
      downloadRenderedVideo(rendered)
    } catch (error) {
      setVersionsError(
        formatVersionDialogError(
          error,
          'Could not download the selected version.',
        ),
      )
    } finally {
      setDownloadingVersionName(null)
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
      previousWorkspaceViewRef.current = 'subtitles'
      setRightPanelView('subtitles')
      setIsCutModeEnabled(false)
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
      if (previewPlaybackMode === 'edited' && selectedSegment) {
        const currentPreviewTime = videoPreviewRef.current.getCurrentTime()

        if (!isSourceTimeInsideClip(selectedSegment, currentPreviewTime)) {
          const clipStart = getClipSourceStart(selectedSegment)
          resetClipHotkeyNavigation()
          videoPreviewRef.current.seekTo(clipStart)
          setCurrentTime(clipStart)
        }
      }
      videoPreviewRef.current.play()
    }
  }

  const handleStepFrame = (direction: -1 | 1) => {
    resetClipHotkeyNavigation()
    videoPreviewRef.current?.stepFrame(direction)
  }

  const handleJumpSeconds = (direction: -1 | 1) => {
    if (previewPlaybackMode === 'original') {
      handleSeekOriginal(clamp(currentTime + direction, 0, totalDuration))
      return
    }

    if (activeTimelineSegment && editedDuration > 0) {
      seekEditedTimelineToTime(timelinePlayheadEditedTime + direction)
      return
    }

    handleSeek(currentTime + direction)
  }

  const handleSelectClipBesidePlayhead = (side: 'next' | 'previous') => {
    if (segments.length === 0 || segmentTimelineLayouts.length === 0) return

    const hotkeyNavigationIndex =
      clipHotkeyNavigationSegmentIdRef.current == null
        ? -1
        : segments.findIndex(
            (segment) => segment.id === clipHotkeyNavigationSegmentIdRef.current,
          )
    const targetSegment = hotkeyNavigationIndex >= 0
      ? (() => {
          const nextIndex =
            hotkeyNavigationIndex + (side === 'next' ? 1 : -1)
          return nextIndex >= 0 && nextIndex < segments.length
            ? segments[nextIndex]
            : null
        })()
      : (() => {
          const playheadTime = clamp(timelinePlayheadEditedTime, 0, editedDuration)
          const boundaryTolerance = 0.001
          const targetLayout =
            side === 'next'
              ? segmentTimelineLayouts.find(
                  (layout) =>
                    layout.duration > 0 &&
                    layout.globalStart >= playheadTime - boundaryTolerance,
                )
              : [...segmentTimelineLayouts]
                  .reverse()
                  .find(
                    (layout) =>
                      layout.duration > 0 &&
                      layout.globalEnd <= playheadTime + boundaryTolerance,
                  )

          if (!targetLayout) return null

          return (
            segments.find((segment) => segment.id === targetLayout.segmentId) ??
            null
          )
        })()

    if (!targetSegment) return

    setActiveWorkflowStep('clean')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    selectSingleClip(targetSegment.id, segments, {
      preserveClipHotkeyNavigation: true,
    })
    clipHotkeyNavigationSegmentIdRef.current = targetSegment.id
  }

  const handleSelectAllClips = () => {
    if (segments.length === 0) return

    const allSegmentIds = segments.map((segment) => segment.id)
    resetClipHotkeyNavigation()
    setActiveWorkflowStep('clean')
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
    applyClipSelection(segments, allSegmentIds, selectedId ?? allSegmentIds[0] ?? null)
  }

  const handleDeselectClips = () => {
    resetClipHotkeyNavigation()
    setSelectedId(null)
    setSelectedSegmentIds([])
    setIsCutModeEnabled(false)
    setActiveCutHandle(null)
  }

  useEffect(() => {
    const handleEditorKeyDown = (event: KeyboardEvent) => {
      if (
        doneActionKind != null ||
        isCreateCategoryModalOpen ||
        isVersionsModalOpen ||
        isEditorHotkeyTextEntryTarget(event.target)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const hasPrimaryModifier = event.ctrlKey || event.metaKey
      const hasNoSystemModifier = !event.ctrlKey && !event.metaKey && !event.altKey
      const isArrowKey =
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'

      if (event.repeat && !isArrowKey) {
        return
      }

      if (hasPrimaryModifier && !event.altKey && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          void handleRedo()
        } else {
          void handleUndo()
        }
        return
      }

      if (hasPrimaryModifier && !event.altKey && !event.shiftKey && key === 'e') {
        event.preventDefault()
        if (exportStatus !== 'processing' && editorStatus !== 'syncing') {
          void handleExportVideo()
        }
        return
      }

      if (hasPrimaryModifier && !event.altKey && !event.shiftKey && key === 'a') {
        event.preventDefault()
        handleSelectAllClips()
        return
      }

      if (hasNoSystemModifier && !event.shiftKey && event.code === 'Space') {
        event.preventDefault()
        handleTogglePlayback()
        return
      }

      if (
        hasNoSystemModifier &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        event.preventDefault()
        const direction = event.key === 'ArrowLeft' ? -1 : 1
        if (event.shiftKey) {
          handleJumpSeconds(direction)
        } else {
          handleStepFrame(direction)
        }
        return
      }

      if (
        hasNoSystemModifier &&
        !event.shiftKey &&
        (event.key === 'ArrowUp' || event.key === 'ArrowDown')
      ) {
        event.preventDefault()
        handleSelectClipBesidePlayhead(
          event.key === 'ArrowUp' ? 'next' : 'previous',
        )
        return
      }

      if (hasNoSystemModifier && !event.shiftKey && key === 's') {
        event.preventDefault()
        void handleSplitAtPlayhead()
        return
      }

      if (
        hasNoSystemModifier &&
        !event.shiftKey &&
        (event.key === 'Delete' || event.key === 'Backspace')
      ) {
        event.preventDefault()
        handleDeleteSelectedClip()
        return
      }

      if (hasNoSystemModifier && !event.shiftKey && event.key === 'Escape') {
        event.preventDefault()
        handleDeselectClips()
      }
    }

    window.addEventListener('keydown', handleEditorKeyDown)
    return () => {
      window.removeEventListener('keydown', handleEditorKeyDown)
    }
  })

  useEffect(() => {
    if (
      previewPlaybackMode !== 'edited' ||
      !isPlaying ||
      !selectedSegment ||
      !videoPreviewRef.current
    ) {
      return
    }

    const ranges = getClipSourceRanges(selectedSegment)
    const currentRange = ranges.find(
      (range) => currentTime >= range.start && currentTime < range.end - 0.05,
    )

    if (currentRange) {
      return
    }

    const nextRange = ranges.find((range) => currentTime < range.start)
    if (nextRange) {
      videoPreviewRef.current.seekTo(nextRange.start)
      setCurrentTime(nextRange.start)
      return
    }

    const clipEndBoundary = Math.max(
      getClipSourceStart(selectedSegment),
      getClipSourceEnd(selectedSegment) - 0.05,
    )
    videoPreviewRef.current.pause()
    videoPreviewRef.current.seekTo(clipEndBoundary)
    setCurrentTime(clipEndBoundary)
  }, [currentTime, isPlaying, previewPlaybackMode, selectedSegment])

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
    const nextZoom = clamp(timelineZoom + direction * 0.5, 1, 4)
    if (nextZoom === timelineZoom) {
      return
    }

    shouldCenterPlayheadAfterZoomRef.current = true
    setTimelineZoom(nextZoom)
  }

  const handleSendAIPrompt = async () => {
    const trimmed = aiPromptDraft.trim()
    if (!trimmed) return
    if (!videoSourceUrl && !selectedVideoFile) {
      setAiRequestStatus('error')
      setAiMessages((prev) => [
        ...prev,
        {
          id: `assistant-video-required-${Date.now()}`,
          role: 'assistant',
          text: 'Please upload or select a video before using AI Workspace.',
        },
      ])
      return
    }

    setAiMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      },
    ])
    setAiPromptDraft('')
    setAreAIQuickActionsVisible(false)
    setAiRequestStatus('sending')

    try {
      let transcriptForAI = subtitleSegments.map((segment) => ({
        start: formatEditableTimestamp(segment.start),
        end: formatEditableTimestamp(segment.end),
        text: segment.text,
      }))

      const { suggestion } = await requestAIEditCommand({
        prompt: trimmed,
        videoDuration: formatEditableTimestamp(videoDuration ?? totalDuration),
        transcript: transcriptForAI,
      })
      setAiPendingSuggestion(suggestion)
      setAiResponseJson(JSON.stringify(suggestion, null, 2))
      setAiRequestStatus('success')
      setAiMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `Intent: ${suggestion.intent}. Review the operations before applying.`,
          suggestion,
        },
      ])
    } catch (error) {
      setAiRequestStatus('error')
      setAiMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: error instanceof Error ? error.message : 'AI request failed.',
        },
      ])
    }
  }

  useEffect(() => {
    if (rightPanelView !== 'ai' || isRightPanelCollapsed) return

    const frameId = window.requestAnimationFrame(() => {
      aiChatEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [
    aiMessages,
    aiPendingSuggestion,
    aiRequestStatus,
    isApplyingAISuggestion,
    isRightPanelCollapsed,
    rightPanelView,
  ])

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

  useEffect(() => {
    if (!activeCutHandle) return

    const handlePointerMove = (event: PointerEvent) => {
      updateCutHandleFromClientX(activeCutHandle, event.clientX)
    }

    const handlePointerUp = () => {
      setActiveCutHandle(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [activeCutHandle, editedDuration, selectedCutDuration, segmentTimelineLayouts])

  useEffect(() => {
    setCutRange((prev) =>
      normalizeCutRange(prev.start, prev.end, selectedCutDuration),
    )
  }, [selectedCutDuration])

  useEffect(() => {
    if (!isCutModeEnabled) {
      return
    }

    setCutRange(buildFullCutRange(selectedCutDuration))
    setActiveCutHandle(null)
  }, [isCutModeEnabled, selectedCutScopeKey, selectedCutDuration])

  const handleApplyAISuggestion = async () => {
    if (!aiPendingSuggestion || isApplyingAISuggestion) return
    setIsApplyingAISuggestion(true)
    const executionNotes: string[] = []
    let shouldClearPendingSuggestion = true
    let skipOperationLoop = false
    try {
      if (
        aiPendingSuggestion.intent === 'chapter_suggest' &&
        aiPendingSuggestion.operations.length === 0
      ) {
        if (aiPendingSuggestion.chapters.length > 0) {
          const session = await ensureEditorSession()
          if (session) {
            try {
              setEditorStatus('syncing')
              let workingSession = await replaceEditorSessionSegments(
                session.sessionId,
                segments,
                selectedId,
              )
              const splitPoints = aiPendingSuggestion.chapters
                .map((chapter) => chapter.start)
                .filter((start): start is string => typeof start === 'string')
                .map((start) => parseEditableTimestamp(start))
                .filter((value): value is number => value != null && Number.isFinite(value))
                .filter((value) => value > 0)
                .sort((a, b) => a - b)
              for (const splitAtSeconds of splitPoints) {
                const containing = workingSession.segments.find(
                  (segment) => splitAtSeconds > segment.start + 0.1 && splitAtSeconds < segment.end - 0.1,
                )
                if (!containing) continue
                workingSession = await splitEditorSessionAtTime(
                  session.sessionId,
                  containing.id,
                  splitAtSeconds,
                )
              }
              const nextSegments = preserveChapterLabels(segments, workingSession.segments)
              const renamedSegments = nextSegments.map((segment, index) => ({
                ...segment,
                label: aiPendingSuggestion.chapters[index]?.title?.trim() || segment.label,
              }))
              setSegments(renamedSegments)
              setChapterSummaryDrafts(
                Object.fromEntries(
                  renamedSegments.map((segment, index) => [
                    segment.id,
                    aiPendingSuggestion.chapters[index]?.summary ?? '',
                  ]),
                ),
              )
              setChapterThumbnailDrafts(
                Object.fromEntries(
                  renamedSegments.map((segment, index) => [
                    segment.id,
                    aiPendingSuggestion.chapters[index]?.thumbnailTime ?? aiPendingSuggestion.chapters[index]?.start ?? null,
                  ]),
                ),
              )
              setRightPanelView('chapters')
              setActiveWorkflowStep('chapters')
              setEditorStatus('ready')
              executionNotes.push('AI chapter suggestions applied to timeline splits and chapter metadata.')
              skipOperationLoop = true
            } catch (error) {
              setEditorStatus('error')
            }
          }
        }
        if (subtitleSegments.length === 0) {
          executionNotes.push(
            'Chapter suggestion requires subtitles/transcript. Do you require assistance in adding subtitles?',
          )
          setAiPendingSuggestion({
            intent: 'subtitle',
            needs_review: true,
            parameters: { sourceIntent: 'chapter_suggest' },
            operations: [{ action: 'add_subtitle', start: null, end: null, text: null }],
            chapters: [],
            notes: ['Subtitles are required before chapter suggestion can run.'],
          })
          shouldClearPendingSuggestion = false
        } else {
          const allowShareTranscript = window.confirm(
            'Allow sharing current subtitles transcript with AI model for chapter analysis?',
          )
          if (!allowShareTranscript) {
            executionNotes.push(
              'Chapter suggestion skipped: transcript sharing was not allowed.',
            )
          } else {
            const transcript = subtitleSegments.map((segment) => ({
              start: formatEditableTimestamp(segment.start),
              end: formatEditableTimestamp(segment.end),
              text: segment.text,
            }))
            const { suggestion } = await requestAIChapterSuggestions({
              videoDuration: formatEditableTimestamp(videoDuration ?? totalDuration),
              transcript,
            })
            setAiPendingSuggestion(suggestion)
            setAiResponseJson(JSON.stringify(suggestion, null, 2))
            shouldClearPendingSuggestion = false
            executionNotes.push(
              `Chapter suggestion generated with transcript context (${transcript.length} subtitle lines). Review the updated suggestions before applying any edits.`,
            )
          }
        }
      }

      if (!skipOperationLoop) for (const operation of aiPendingSuggestion.operations) {
      if (operation.action === 'split_at') {
        const splitAtSeconds = operation.start
          ? parseEditableTimestamp(operation.start)
          : null
        if (splitAtSeconds == null) {
          executionNotes.push('Split operation skipped: invalid or missing split timestamp.')
          continue
        }

        const containingSegment = segments.find(
          (segment) =>
            splitAtSeconds > segment.start + 0.1 &&
            splitAtSeconds < segment.end - 0.1,
        )
        if (!containingSegment) {
          executionNotes.push(
            `Split skipped: ${operation.start} is outside a splittable segment.`,
          )
          continue
        }

        const session = await ensureEditorSession()
        if (!session) {
          executionNotes.push('Split skipped: editor session is unavailable.')
          continue
        }

        try {
          setEditorStatus('syncing')
          const previousState = captureEditorState()
          const nextSession = await splitEditorSessionAtTime(
            session.sessionId,
            containingSegment.id,
            splitAtSeconds,
          )
          setHistory((prev) => [...prev.slice(-29), previousState])
          const nextSegments = preserveChapterLabels(segments, nextSession.segments)
          setSegments(nextSegments)
          applyClipSelection(
            nextSegments,
            nextSession.selectedSegmentId != null
              ? [nextSession.selectedSegmentId]
              : [],
            nextSession.selectedSegmentId ?? nextSegments[0]?.id ?? null,
          )
          setEditorStatus('ready')
          handleSeek(splitAtSeconds)
          executionNotes.push(`Split applied at ${operation.start}.`)
        } catch (error) {
          setEditorStatus('error')
          executionNotes.push(
            error instanceof Error
              ? `Split failed: ${error.message}`
              : 'Split failed unexpectedly.',
          )
        }
        continue
      }

      if (operation.action === 'add_subtitle') {
        if (subtitleSegments.length === 0) {
          void handleGenerateSubtitlesFromPanel()
          executionNotes.push(
            'Subtitle generation started because no subtitle track existed.',
          )
        } else {
          executionNotes.push(
            'TODO: range-based subtitle insertion adapter is not connected yet.',
          )
        }
        continue
      }

      if (operation.action === 'trim_silence') {
        const session = await ensureEditorSession()
        if (!session) {
          executionNotes.push('Silence trim skipped: editor session is unavailable.')
          continue
        }
        try {
          setEditorStatus('syncing')
          const previousState = captureEditorState()
          const parsePositiveSeconds = (value: unknown): number | null => {
            if (typeof value === 'number') {
              return Number.isFinite(value) && value > 0 ? value : null
            }
            if (typeof value === 'string') {
              const direct = Number(value)
              if (Number.isFinite(direct) && direct > 0) {
                return direct
              }
              const matched = value.match(/(\d+(?:\.\d+)?)/)
              if (!matched) return null
              const parsed = Number(matched[1])
              return Number.isFinite(parsed) && parsed > 0 ? parsed : null
            }
            return null
          }
          const rawThreshold = aiPendingSuggestion.parameters?.minSilenceSeconds
          const fallbackThreshold = parsePositiveSeconds(operation.text)
          const thresholdSeconds =
            parsePositiveSeconds(rawThreshold) ?? fallbackThreshold
          const detection =
            silenceSegments.length > 0
              ? {
                  audioDuration:
                    silenceSegments[silenceSegments.length - 1]?.end ??
                    session.duration,
                  silenceSegments,
                  speechSegments: [],
                }
              : isTimelineUnedited(segments, videoDuration)
                ? await (async () => {
                    const videoFile = await ensureVideoFile()
                    if (!videoFile) {
                      throw new Error(
                        'Upload a local video file before trimming silence with AI.',
                      )
                    }
                    return detectSilenceFromVideo(videoFile, {
                      noiseThresholdDb: -35,
                      minSilenceDuration:
                        thresholdSeconds != null && Number.isFinite(thresholdSeconds)
                          ? thresholdSeconds
                          : 0.6,
                      minSegmentDuration: 0.25,
                    })
                  })()
                : await detectSilenceInEditorSession(session.sessionId, {
                    minSilenceDuration:
                      thresholdSeconds != null && Number.isFinite(thresholdSeconds)
                        ? thresholdSeconds
                        : undefined,
                  })
          let resolvedSilenceSegments = detection.silenceSegments
          if (
            resolvedSilenceSegments.length === 0 &&
            !isTimelineUnedited(segments, videoDuration)
          ) {
            const videoFile = await ensureVideoFile()
            if (videoFile) {
              const sourceDetection = await detectSilenceFromVideo(videoFile, {
                noiseThresholdDb: -35,
                minSilenceDuration:
                  thresholdSeconds != null && Number.isFinite(thresholdSeconds)
                    ? thresholdSeconds
                    : 0.6,
                minSegmentDuration: 0.25,
              })
              resolvedSilenceSegments = sourceDetection.silenceSegments
                .map((silence) => {
                  for (const segment of segments) {
                    const start = Math.max(silence.start, segment.start)
                    const end = Math.min(silence.end, segment.end)
                    if (end - start >= 0.6) {
                      return { start, end }
                    }
                  }
                  return null
                })
                .filter((segment): segment is { start: number; end: number } => segment != null)
            }
          }
          const candidateDurations = resolvedSilenceSegments.map((segment) =>
            Number((segment.end - segment.start).toFixed(2)),
          )
          const targetSilenceSegments =
            thresholdSeconds != null && Number.isFinite(thresholdSeconds)
              ? resolvedSilenceSegments.filter(
                  (segment) => segment.end - segment.start >= thresholdSeconds,
                )
              : resolvedSilenceSegments
          executionNotes.push(
            `Silence debug: candidates=${resolvedSilenceSegments.length}, durations=[${candidateDurations.join(
              ', ',
            )}], threshold=${thresholdSeconds ?? 'none'}.`,
          )
          if (targetSilenceSegments.length === 0) {
            executionNotes.push('No silence segments detected to remove.')
            setEditorStatus('ready')
            continue
          }

          const nextSession = await deleteSilenceRangesFromEditorSession(
            session.sessionId,
            targetSilenceSegments,
          )
          setHistory((prev) => [...prev.slice(-29), previousState])
          const nextSegments = preserveChapterLabels(segments, nextSession.segments)
          setSegments(nextSegments)
          applyClipSelection(
            nextSegments,
            nextSession.selectedSegmentId != null
              ? [nextSession.selectedSegmentId]
              : [],
            nextSession.selectedSegmentId ?? nextSegments[0]?.id ?? null,
          )
          setEditorStatus('ready')
          setSilenceSegments([])
          setSelectedSilenceSegmentKeys([])
          setStagedSilenceSegmentKeys([])
          executionNotes.push(
            `Silence trim applied to ${targetSilenceSegments.length} detected ranges.`,
          )
        } catch (error) {
          setEditorStatus('error')
          executionNotes.push(
            error instanceof Error
              ? `Silence trim failed: ${error.message}`
              : 'Silence trim failed unexpectedly.',
          )
        }
        continue
      }

      if (operation.action === 'keep' || operation.action === 'remove') {
        const cutStartSeconds = operation.start
          ? parseEditableTimestamp(operation.start)
          : null
        const cutEndSeconds = operation.end
          ? parseEditableTimestamp(operation.end)
          : null
        if (
          cutStartSeconds == null ||
          cutEndSeconds == null ||
          !Number.isFinite(cutStartSeconds) ||
          !Number.isFinite(cutEndSeconds) ||
          cutEndSeconds <= cutStartSeconds
        ) {
          executionNotes.push(
            'Cut skipped: keep/remove operation is missing a valid start/end range.',
          )
          continue
        }

        const session = await ensureEditorSession()
        if (!session) {
          executionNotes.push('Cut skipped: editor session is unavailable.')
          continue
        }

        const selectedForCut =
          selectedSegments.length > 0
            ? [...orderedSelectedSegmentIds]
            : segments.map((segment) => segment.id)

        try {
          setEditorStatus('syncing')
          const previousState = captureEditorState()
          const nextSession = await cutEditorSessionToRange(
            session.sessionId,
            cutStartSeconds,
            cutEndSeconds,
            selectedForCut,
          )
          setHistory((prev) => [...prev.slice(-29), previousState])
          const nextSegments = preserveChapterLabels(segments, nextSession.segments)
          setSegments(nextSegments)
          applyClipSelection(
            nextSegments,
            nextSession.selectedSegmentId != null
              ? [nextSession.selectedSegmentId]
              : [],
            nextSession.selectedSegmentId ?? nextSegments[0]?.id ?? null,
          )
          setCutRange(buildFullCutRange(cutEndSeconds - cutStartSeconds))
          setIsCutModeEnabled(false)
          setActiveCutHandle(null)
          setEditorStatus('ready')
          executionNotes.push(
            `${operation.action === 'remove' ? 'Cut' : 'Keep'} applied for ${operation.start} to ${operation.end} (outside removed).`,
          )
        } catch (error) {
          setEditorStatus('error')
          executionNotes.push(
            error instanceof Error
              ? `Cut failed: ${error.message}`
              : 'Cut failed unexpectedly.',
          )
        }
        continue
      }

      if (operation.action === 'mute') {
        executionNotes.push('TODO: mute adapter is not connected yet.')
        continue
      }

      if (operation.action === 'suggest_chapter') {
        if (
          aiPendingSuggestion.intent === 'chapter_suggest' &&
          aiPendingSuggestion.chapters.length > 0
        ) {
          const session = await ensureEditorSession()
          if (!session) {
            executionNotes.push('Chapter suggestion skipped: editor session is unavailable.')
            continue
          }
          try {
            setEditorStatus('syncing')
            let workingSession = await replaceEditorSessionSegments(
              session.sessionId,
              segments,
              selectedId,
            )
            const splitPoints = aiPendingSuggestion.chapters
              .map((chapter) => chapter.start)
              .filter((start): start is string => typeof start === 'string')
              .map((start) => parseEditableTimestamp(start))
              .filter((value): value is number => value != null && Number.isFinite(value))
              .filter((value) => value > 0)
              .sort((a, b) => a - b)
            for (const splitAtSeconds of splitPoints) {
              const containing = workingSession.segments.find(
                (segment) => splitAtSeconds > segment.start + 0.1 && splitAtSeconds < segment.end - 0.1,
              )
              if (!containing) continue
              workingSession = await splitEditorSessionAtTime(
                session.sessionId,
                containing.id,
                splitAtSeconds,
              )
            }
            const nextSegments = preserveChapterLabels(segments, workingSession.segments)
            const renamedSegments = nextSegments.map((segment, index) => ({
              ...segment,
              label: aiPendingSuggestion.chapters[index]?.title?.trim() || segment.label,
            }))
            setSegments(renamedSegments)
            setChapterSummaryDrafts(
              Object.fromEntries(
                renamedSegments.map((segment, index) => [
                  segment.id,
                  aiPendingSuggestion.chapters[index]?.summary ?? '',
                ]),
              ),
            )
            setChapterThumbnailDrafts(
              Object.fromEntries(
                renamedSegments.map((segment, index) => [
                  segment.id,
                  aiPendingSuggestion.chapters[index]?.thumbnailTime ?? aiPendingSuggestion.chapters[index]?.start ?? null,
                ]),
              ),
            )
            setRightPanelView('chapters')
            setActiveWorkflowStep('chapters')
            setEditorStatus('ready')
            executionNotes.push('AI chapter suggestions applied to timeline splits and chapter metadata.')
          } catch (error) {
            setEditorStatus('error')
            executionNotes.push(
              error instanceof Error ? `Chapter apply failed: ${error.message}` : 'Chapter apply failed unexpectedly.',
            )
          }
          continue
        }
        if (subtitleSegments.length === 0) {
          executionNotes.push(
            'Automatic chapter split requires subtitles. Do you require assistance in adding subtitles?',
          )
          setAiPendingSuggestion({
            intent: 'subtitle',
            needs_review: true,
            parameters: { sourceIntent: 'chapter_suggest' },
            operations: [{ action: 'add_subtitle', start: null, end: null, text: null }],
            chapters: [],
            notes: ['Subtitles are required before chapter suggestion can run.'],
          })
          shouldClearPendingSuggestion = false
          continue
        }

        const allowShareTranscript = window.confirm(
          'Allow sharing current subtitles transcript with AI model for chapter analysis?',
        )
        if (!allowShareTranscript) {
          executionNotes.push('Chapter suggestion skipped: transcript sharing was not allowed.')
          continue
        }

        const transcript = subtitleSegments.map((segment) => ({
          start: formatEditableTimestamp(segment.start),
          end: formatEditableTimestamp(segment.end),
          text: segment.text,
        }))
        const { suggestion } = await requestAIChapterSuggestions({
          videoDuration: formatEditableTimestamp(videoDuration ?? totalDuration),
          transcript,
        })
        setAiPendingSuggestion(suggestion)
        setAiResponseJson(JSON.stringify(suggestion, null, 2))
        shouldClearPendingSuggestion = false
        executionNotes.push(
          `Chapter suggestion refreshed with transcript context (${transcript.length} subtitle lines). Review updated suggestions.`,
        )
      }
    }

    setAiMessages((prev) => [
      ...prev,
      {
        id: `assistant-loop-${Date.now()}`,
        role: 'assistant',
        text:
          executionNotes.length > 0
            ? executionNotes.join(' ')
            : 'No executable AI operations were found in this suggestion.',
      },
    ])
    if (shouldClearPendingSuggestion) {
      setAiPendingSuggestion(null)
    }
    } finally {
      setIsApplyingAISuggestion(false)
    }
  }

  const handleCancelAISuggestion = () => setAiPendingSuggestion(null)

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0
  const topTabClass = ({ isActive }: { isActive: boolean }) =>
    `flex h-10 items-center gap-2 rounded-t-2xl border px-4 text-[12px] font-bold uppercase tracking-[0.12em] transition ${
      isActive
        ? isDark
          ? 'border-[#243149] bg-[#0b1220] text-[#edf2ff] shadow-[0_-8px_24px_rgba(15,23,42,0.18)]'
          : 'border-white bg-white text-[#003fb1] shadow-[0_-8px_24px_rgba(15,23,42,0.12)]'
        : isDark
          ? 'border-white/10 bg-white/8 text-white/78 hover:bg-white/14 hover:text-white'
          : 'border-white/15 bg-white/14 text-white/82 hover:bg-white/22 hover:text-white'
    }`

  const timeMarkers = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) =>
        formatClock((editedDuration / 5) * index),
      ),
    [editedDuration],
  )
  const exportDialogTitle =
    activeExportKind === 'clip' ? 'Rendering Chapter' : 'Rendering Video'
  const exportDialogDescription =
    activeExportKind === 'clip'
      ? 'VidVersity is processing the selected chapter. Your download will start automatically when the render finishes.'
      : 'VidVersity is merging your current timeline into a continuous video. Your download will start automatically when the render finishes.'

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
              {exportDialogTitle}
            </h2>
            <p
              className={`mt-3 text-sm leading-6 ${
                isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
              }`}
            >
              {exportDialogDescription}
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

      {mergeStatus === 'processing' ? (
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
              Merging Chapters
            </h2>
            <p
              className={`mt-3 text-sm leading-6 ${
                isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
              }`}
            >
              VidVersity is merging the selected chapters and rebuilding the
              working video. This can take a moment.
            </p>
          </div>
        </div>
      ) : null}

      {subtitleStatus === 'processing' ? (
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
            <h2 className={`mt-4 text-[15px] font-bold uppercase tracking-[0.2em] ${
              isDark ? 'text-[#ff9dd7]' : 'text-[#c2187a]'
            }`}>
              Processing Subtitles
            </h2>
            <p className={`mt-3 text-sm leading-6 ${
              isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
            }`}>
              VidVersity is generating subtitle scripts for your video. This can take a moment for larger files.
            </p>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-[#de34ab] px-5 py-3 text-white shadow-[0_12px_40px_rgba(222,52,171,0.28)] sm:items-end sm:pb-0 sm:pt-3">
        <div className="flex min-w-0 items-center gap-8 sm:items-end">
          <div className="shrink-0 font-['Manrope'] text-xl font-extrabold tracking-[-0.04em] sm:pb-3">
            Vidversity
          </div>
          <nav className="hidden min-w-0 items-end gap-1 sm:ml-[112px] sm:flex">
            <NavLink
              to="/drafts"
              className={topTabClass}
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
              className={topTabClass}
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
              className={topTabClass}
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
        </div>

        <div className="flex items-center gap-4 sm:pb-3">
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
	            className="hidden rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24 sm:block"
	          >
	            <HelpCircle className="h-4 w-4" />
	          </button>
	          <button
	            type="button"
	            className="relative hidden rounded-full bg-white/18 p-2 backdrop-blur transition hover:bg-white/24 sm:block"
	          >
	            <Bell className="h-4 w-4" />
	            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
	          </button>
	          <div className="hidden h-9 w-9 items-center justify-center rounded-full border-2 border-white/25 bg-white/20 font-semibold sm:flex">
	            NR
	          </div>
        </div>
      </header>

      <div
        className={`grid h-[calc(100vh-68px)] grid-cols-1 overflow-visible ${
          guidedMode
            ? isRightPanelCollapsed
              ? 'xl:grid-cols-[248px_minmax(0,1fr)_72px]'
              : 'xl:grid-cols-[248px_minmax(0,1fr)_340px]'
            : isRightPanelCollapsed
              ? 'xl:grid-cols-[minmax(0,1fr)_72px]'
              : 'xl:grid-cols-[minmax(0,1fr)_340px]'
        } ${isDark ? 'bg-[#0b1220]' : 'bg-[#f7f9fb]'}`}
      >
        <Dialog
          open={isCreateCategoryModalOpen}
          onOpenChange={setIsCreateCategoryModalOpen}
        >
          <DialogContent
            className={`sm:max-w-[420px] ${
              isDark
                ? 'border-[#243149] bg-[#0f172a] text-[#edf2ff]'
                : 'border-[#e3e7ee] bg-white text-[#191c1e]'
            }`}
          >
            <DialogHeader>
              <DialogTitle>Create new category</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={newCategoryDraft}
                onChange={(event) => setNewCategoryDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleCreateCategory()
                  }
                }}
                placeholder="e.g. Lectures, Marketing, Tutorials"
                className={`h-10 rounded-xl text-sm ${
                  isDark
                    ? 'border-[#31415a] bg-[#111827] text-[#edf2ff] placeholder:text-[#64748b]'
                    : 'border-[#d9dde5] bg-white text-[#191c1e] placeholder:text-[#8a94a6]'
                }`}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={normalizeCategoryName(newCategoryDraft).length === 0}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#1a56db] text-white hover:bg-[#2b67ec]'
                      : 'bg-[#003fb1] text-white hover:bg-[#1a56db]'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={doneActionKind != null}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseDoneActionModal()
            }
          }}
        >
          <DialogContent
            className={`sm:max-w-[460px] ${
              isDark
                ? 'border-[#243149] bg-[#0f172a] text-[#edf2ff]'
                : 'border-[#e3e7ee] bg-white text-[#191c1e]'
            }`}
          >
            <DialogHeader>
              <DialogTitle>
                {doneActionKind ? getDoneActionLabel(doneActionKind) : 'Video Details'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
                    isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
                  }`}
                  htmlFor="done-video-title"
                >
                  Video Title
                </label>
                <Input
                  id="done-video-title"
                  value={doneVideoTitleDraft}
                  onChange={(event) => setDoneVideoTitleDraft(event.target.value)}
                  className={`h-10 rounded-xl text-sm ${
                    isDark
                      ? 'border-[#31415a] bg-[#111827] text-[#edf2ff] placeholder:text-[#64748b]'
                      : 'border-[#d9dde5] bg-white text-[#191c1e] placeholder:text-[#8a94a6]'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label
                  className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
                    isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
                  }`}
                >
                  Video Category
                </label>
                <Select
                  value={doneCategoryDraft || DEFAULT_CATEGORY_VALUE}
                  onValueChange={handleDoneActionCategorySelect}
                >
                  <SelectTrigger
                    className={`h-10 rounded-xl border text-sm ${
                      isDark
                        ? 'border-[#31415a] bg-[#111827] text-[#edf2ff]'
                        : 'border-[#d9dde5] bg-white text-[#191c1e]'
                    }`}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_CATEGORY_VALUE}>
                      No category
                    </SelectItem>
                    <SelectItem value={NEW_CATEGORY_VALUE}>
                      New category
                    </SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {doneActionKind === 'add-existing-course' ? (
                <div className="space-y-2">
                  <label
                    className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
                      isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
                    }`}
                  >
                    Course
                  </label>
                  <Select
                    value={doneCourseDraft}
                    onValueChange={setDoneCourseDraft}
                  >
                    <SelectTrigger
                      className={`h-10 rounded-xl border text-sm ${
                        isDark
                          ? 'border-[#31415a] bg-[#111827] text-[#edf2ff]'
                          : 'border-[#d9dde5] bg-white text-[#191c1e]'
                      }`}
                    >
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXISTING_COURSE_OPTIONS.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {doneActionKind === 'add-new-course' ? (
                <div className="space-y-2">
                  <label
                    className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
                      isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
                    }`}
                    htmlFor="done-new-course-name"
                  >
                    New Course Name
                  </label>
                  <Input
                    id="done-new-course-name"
                    value={doneNewCourseNameDraft}
                    onChange={(event) =>
                      setDoneNewCourseNameDraft(event.target.value)
                    }
                    placeholder="e.g. Biology 101"
                    className={`h-10 rounded-xl text-sm ${
                      isDark
                        ? 'border-[#31415a] bg-[#111827] text-[#edf2ff] placeholder:text-[#64748b]'
                        : 'border-[#d9dde5] bg-white text-[#191c1e] placeholder:text-[#8a94a6]'
                    }`}
                  />
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDoneActionModal}
                  className={`flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
                    isDark
                      ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:bg-[#182238]'
                      : 'border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDoneAction}
                  disabled={doneVideoTitleDraft.trim().length === 0}
                  className={`flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#1a56db] text-white hover:bg-[#2b67ec]'
                      : 'bg-[#003fb1] text-white hover:bg-[#1a56db]'
                  }`}
                >
                  {doneActionKind ? getDoneActionConfirmLabel(doneActionKind) : 'Save'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isVersionsModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseVersionsModal()
            }
          }}
        >
          <DialogContent
            className={`sm:max-w-[560px] ${
              isDark
                ? 'border-[#243149] bg-[#0f172a] text-[#edf2ff]'
                : 'border-[#e3e7ee] bg-white text-[#191c1e]'
            }`}
          >
            <DialogHeader>
              <DialogTitle>Saved versions</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p
                className={`text-[12px] leading-5 ${
                  isDark ? 'text-[#8aa0c4]' : 'text-[#515f74]'
                }`}
              >
                The original upload is kept as <span className="font-semibold">_original</span>.
                Each saved edit is stored with a <span className="font-semibold">_YYYYMMDD_HHMMSS</span>{' '}
                timestamp. You can review what is already saved, remove versions
                you no longer need, or save the current edit as a new version.
              </p>

              {versionsError ? (
                <div
                  className={`rounded-xl border px-3 py-2 text-[12px] ${
                    isDark
                      ? 'border-[#6f3a45] bg-[#3d1f24] text-[#ff8f9a]'
                      : 'border-[#f0b8b8] bg-[#fdecec] text-[#a23535]'
                  }`}
                >
                  {versionsError}
                </div>
              ) : null}

              <div
                className={`max-h-[260px] overflow-auto rounded-2xl border ${
                  isDark
                    ? 'border-[#243149] bg-[#111827]'
                    : 'border-[#e3e7ee] bg-[#fbfcfd]'
                }`}
              >
                {versionsStatus === 'loading' ? (
                  <div
                    className={`px-3 py-6 text-center text-[12px] ${
                      isDark ? 'text-[#8aa0c4]' : 'text-[#515f74]'
                    }`}
                  >
                    Loading saved versions...
                  </div>
                ) : editorVersions.length === 0 ? (
                  <div
                    className={`px-3 py-6 text-center text-[12px] ${
                      isDark ? 'text-[#8aa0c4]' : 'text-[#515f74]'
                    }`}
                  >
                    No saved versions yet for this session.
                  </div>
                ) : (
                  <ul className="divide-y divide-transparent">
                    {editorVersions.map((version) => {
                      const isDeleting = deletingVersionName === version.fileName
                      const isSwitching = switchingVersionName === version.fileName
                      const isDownloading =
                        downloadingVersionName === version.fileName
                      const canDelete = !version.isOriginal && !version.isCurrent
                      const sizeMb = version.sizeBytes / (1024 * 1024)
                      const displayName = version.displayName.replace(
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
                        '',
                      )
                      const createdLabel = version.createdAt
                        ? new Date(version.createdAt).toLocaleString()
                        : ''
                      return (
                        <li
                          key={version.fileName}
                          className={`flex flex-col gap-2 border-b px-3 py-2 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3 ${
                            isDark
                              ? 'border-[#243149]'
                              : 'border-[#e3e7ee]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`line-clamp-2 break-all text-[12px] font-semibold ${
                                  isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'
                                }`}
                                title={displayName}
                              >
                                {displayName}
                              </span>
                              {version.isOriginal ? (
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
                                    isDark
                                      ? 'border-[#3a6f59] text-[#8fffb1]'
                                      : 'border-[#b8f0c9] text-[#1f7a3a]'
                                  }`}
                                >
                                  Original
                                </span>
                              ) : null}
                              {version.isCurrent ? (
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
                                    isDark
                                      ? 'border-[#3a526f] text-[#8fbfff]'
                                      : 'border-[#b8d4f0] text-[#003fb1]'
                                  }`}
                                >
                                  Current
                                </span>
                              ) : null}
                            </div>
                            <div
                              className={`mt-1 text-[10px] ${
                                isDark ? 'text-[#8aa0c4]' : 'text-[#8a94a6]'
                              }`}
                            >
                              {createdLabel}
                              {sizeMb > 0
                                ? ` · ${sizeMb.toFixed(sizeMb >= 10 ? 0 : 1)} MB`
                                : ''}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                            <button
                              type="button"
                              onClick={() => {
                                void handleSwitchEditorVersion(version.fileName)
                              }}
                              disabled={version.isCurrent || isSwitching}
                              title={
                                version.isCurrent
                                  ? 'This is already the current active version.'
                                  : 'Switch to this version'
                              }
                              className={`flex h-8 items-center justify-center gap-1 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDark
                                  ? 'border-[#3a526f] text-[#8fbfff] hover:bg-[#182238]'
                                  : 'border-[#b8d4f0] text-[#003fb1] hover:bg-[#eef4ff]'
                              }`}
                            >
                              {isSwitching ? 'Switching...' : 'Switch'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleDownloadEditorVersion(
                                  version.fileName,
                                )
                              }}
                              disabled={isDownloading}
                              className={`flex h-8 items-center justify-center gap-1 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDark
                                  ? 'border-[#31415a] text-[#c6d3eb] hover:bg-[#182238]'
                                  : 'border-[#d9dde5] text-[#515f74] hover:bg-[#f7f9fb]'
                              }`}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {isDownloading ? '...' : 'Download'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleDeleteEditorVersion(version.fileName)
                              }}
                              disabled={!canDelete || isDeleting}
                              title={
                                !canDelete
                                  ? version.isOriginal
                                    ? 'The original version cannot be deleted.'
                                    : 'The current active version cannot be deleted.'
                                  : 'Delete this version'
                              }
                              className={`flex h-8 items-center justify-center gap-1 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDark
                                  ? 'border-[#6f3a45] text-[#ff8f9a] hover:bg-[#3d1f24]'
                                  : 'border-[#f0b8b8] text-[#a23535] hover:bg-[#fdecec]'
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {isDeleting ? '...' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {saveVersionError ? (
                <div
                  className={`rounded-xl border px-3 py-2 text-[12px] ${
                    isDark
                      ? 'border-[#6f3a45] bg-[#3d1f24] text-[#ff8f9a]'
                      : 'border-[#f0b8b8] bg-[#fdecec] text-[#a23535]'
                  }`}
                >
                  {saveVersionError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseVersionsModal}
                  className={`flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
                    isDark
                      ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:bg-[#182238]'
                      : 'border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb]'
                  }`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveCurrentVersion()
                  }}
                  disabled={
                    saveVersionStatus === 'saving' ||
                    editorStatus === 'syncing' ||
                    (!selectedVideoFile && !editorSessionId)
                  }
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#1a56db] text-white hover:bg-[#2b67ec]'
                      : 'bg-[#003fb1] text-white hover:bg-[#1a56db]'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  {saveVersionStatus === 'saving'
                    ? 'Saving Version...'
                    : 'Save Current Edit as New Version'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

        {guidedMode ? (
          <aside
            className={`hidden min-h-0 overflow-visible border-r px-4 py-4 xl:flex xl:flex-col xl:justify-between ${
              isDark
                ? 'border-[#243149] bg-[#121a2b]'
                : 'border-[#d9dde5] bg-[#f2f4f6]'
            }`}
          >
	          <div className="space-y-5">
	            <div
	              className={`rounded-[20px] border px-3 py-3 ${
	                isDark
	                  ? 'border-[#243149] bg-[#0f172a]'
	                  : 'border-[#e3e7ee] bg-white'
	              }`}
	            >
	              <p
	                className={`mb-3 text-[10px] font-bold uppercase tracking-[0.18em] ${
	                  isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
	                }`}
	              >
	                Workflow
	              </p>
	              <div className="space-y-1.5">
	                {workflowSteps.map((step, index) => {
	                  const StepIcon = step.icon
	                  const activeIndex = workflowSteps.findIndex(
	                    (candidate) => candidate.id === activeWorkflowStep,
	                  )
	                  const isActive = activeWorkflowStep === step.id
	                  const isComplete = activeIndex > index

	                  return (
		                    <button
		                      type="button"
		                      key={step.id}
		                      onClick={() => handleWorkflowStepClick(step.id as WorkflowStepId)}
		                      className={`group relative flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
		                        isActive
		                          ? isDark
		                            ? 'border-[#8bb8ff] bg-[#182238] text-[#edf2ff] shadow-[0_10px_22px_rgba(139,184,255,0.12)]'
	                            : 'border-[#7aa4ff] bg-[#eef3ff] text-[#003fb1] shadow-[0_10px_22px_rgba(0,63,177,0.1)]'
	                          : isComplete
	                            ? isDark
	                              ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb]'
	                              : 'border-[#d9dde5] bg-[#fbfcfd] text-[#515f74]'
	                            : isDark
	                              ? 'border-[#243149] bg-[#111827] text-[#8fa2c2]'
	                              : 'border-[#e3e7ee] bg-[#fbfcfd] text-[#637287]'
	                      }`}
	                    >
	                      <span
	                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
	                          isActive
	                            ? isDark
	                              ? 'bg-[#1b3566] text-[#9ec5ff]'
	                              : 'bg-white text-[#003fb1]'
	                            : isDark
	                              ? 'bg-[#1e293b] text-[#8fa2c2]'
	                              : 'bg-[#f2f4f6] text-[#637287]'
	                        }`}
	                      >
	                        <StepIcon className="h-3.5 w-3.5" />
	                      </span>
	                      <span className="min-w-0">
	                        <span className="block text-[8px] font-bold uppercase tracking-[0.1em]">
	                          {step.step}
	                        </span>
	                        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em]">
	                          {step.label}
		                        </span>
		                      </span>
		                      {guidedMode ? (
			                        <span
			                          className={`pointer-events-none absolute left-full top-1/2 z-[300] ml-3 hidden w-52 -translate-y-1/2 rounded-2xl border p-3 text-left shadow-xl group-hover:block ${
			                            isDark
			                              ? 'border-[#31415a] bg-[#0f172a]'
			                              : 'border-[#d9dde5] bg-white'
			                          }`}
			                        >
			                          <span
			                            className={`block text-[9px] font-extrabold uppercase tracking-[0.2em] ${
			                              isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
			                            }`}
			                          >
			                            Guided Tip
			                          </span>
			                          <span
			                            className={`mt-1 block text-[11px] leading-4 ${
			                              isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'
			                            }`}
			                          >
			                            {step.tooltip}
			                          </span>
			                        </span>
		                      ) : null}
		                    </button>
	                  )
	                })}
	              </div>
	            </div>

	          </div>

	        </aside>
        ) : null}

        <main
          className={`min-h-0 min-w-0 overflow-y-auto overflow-x-hidden ${
            isDark ? 'bg-[#0b1220]' : 'bg-[#f7f9fb]'
          }`}
        >
          <div
            className={`mx-auto flex min-h-full w-full flex-col px-3 py-2.5 xl:px-4 xl:py-3 ${
              guidedMode ? 'max-w-[1120px]' : 'max-w-[1368px]'
            }`}
          >
            <div
              className={`flex min-h-0 flex-1 flex-col overflow-visible rounded-[32px] border shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
                isDark
                  ? 'border-[#243149] bg-[#111827]'
                  : 'border-[#d9dde5] bg-white'
              }`}
            >
              <VideoPreviewPanel
                ref={videoPreviewRef}
                videoUrl={videoSourceUrl ?? preloadedVideoUrl}
                subtitles={subtitleSegments}
                playbackMode={previewPlaybackMode}
                onLoadedMetadata={(duration) => {
                  setVideoDuration(duration)
                  setCutRange(buildFullCutRange(duration))
                }}
                onPlaybackStateChange={setIsPlaying}
                onTimeUpdate={setCurrentTime}
                onVideoSourceChange={setVideoSourceUrl}
                onVideoFileChange={(file) => {
                  setSelectedVideoFile(file)
                  resetWorkspaceForNewSource()
                }}
              />

	              <section
	                className={`relative mt-auto border-t ${
	                  isDark
	                    ? 'border-[#243149] bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]'
	                    : 'border-[#e3e7ee] bg-[linear-gradient(180deg,#fbfcfd_0%,#f3f6f9_100%)]'
	                }`}
	              >
		                <button
		                  type="button"
		                  onClick={handleOpenAIPanel}
		                  className={`group absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_12px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 ${
		                    rightPanelView === 'ai' && !isRightPanelCollapsed
		                      ? isDark
		                        ? 'border-[#8bb8ff] bg-[#1b3566] text-[#cfe3ff]'
	                        : 'border-[#7aa4ff] bg-[#e8f0ff] text-[#00308a]'
	                      : isDark
	                        ? 'border-[#31415a] bg-[#0f172a] text-[#d6deec] hover:border-[#8bb8ff] hover:text-[#cfe3ff]'
	                        : 'border-[#d9dde5] bg-white text-[#5b687c] hover:border-[#7aa4ff] hover:text-[#003fb1]'
	                  }`}
	                  title="Open AI chat"
		                  aria-label="Open AI chat"
		                >
		                  <Sparkles className="h-4.5 w-4.5" />
		                  {guidedMode ? (
		                    <span
		                      className={`pointer-events-none absolute right-full top-1/2 z-[300] mr-3 hidden w-48 -translate-y-1/2 rounded-2xl border p-3 text-left shadow-xl group-hover:block ${
		                        isDark
		                          ? 'border-[#31415a] bg-[#0f172a]'
		                          : 'border-[#d9dde5] bg-white'
		                      }`}
		                    >
		                      <span
		                        className={`block text-[9px] font-extrabold uppercase tracking-[0.2em] ${
		                          isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'
		                        }`}
		                      >
		                        Guided Tip
		                      </span>
		                      <span
		                        className={`mt-1 block text-[11px] leading-4 ${
		                          isDark ? 'text-[#edf2ff]' : 'text-[#191c1e]'
		                        }`}
		                      >
		                        Open AI chat for editing help and quick suggestions.
		                      </span>
		                    </span>
		                  ) : null}
		                </button>
	                <div className="mx-auto w-full max-w-[1040px] px-4 py-2.5">
                  <div
                    className={`rounded-[20px] border px-3 py-2 shadow-[0_14px_36px_rgba(15,23,42,0.05)] ${
                      isDark
                        ? 'border-[#243149] bg-[#0f172a]'
                        : 'border-[#d9dde5] bg-white'
                    }`}
                  >
                    <div
                      className={`mb-2 flex flex-wrap items-center justify-center gap-2.5 border-b pb-2 ${
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

	                    <div className="flex flex-wrap items-stretch justify-center gap-1.5">
	                      <div
	                        className="flex items-start gap-1 px-1 py-1"
	                      >
	                        <div className="flex flex-col items-center gap-1">
	                          <ToolbarButton
	                            label="Cut"
	                            tooltip={
	                              isCutModeEnabled
	                                ? 'Turn off cut mode without applying the selected range.'
	                                : 'Activate cut mode so you can drag the pink range handles across the selected clips on the timeline.'
	                            }
	                            guidedMode={guidedMode}
	                            isDark={isDark}
	                            onClick={handleActivateCutMode}
	                            icon={Scissors}
	                            disabled={!canCutSelectedSegments}
	                            active={isCutModeEnabled}
	                            emphasized={activeWorkflowStep === 'clean'}
	                            tone="workspace"
	                          />
	                          {isCutModeEnabled ? (
	                            <div className="flex items-center gap-1">
	                              <ToolbarButton
	                                label="Apply Cut"
	                                tooltip="Apply the selected cut range and remove everything outside it from the selected clips."
	                                guidedMode={guidedMode}
	                                isDark={isDark}
	                                onClick={() => {
	                                  void handleCutVideo()
	                                }}
	                                icon={CheckCheck}
	                                disabled={!canCutSelectedSegments}
	                                emphasized={activeWorkflowStep === 'clean'}
	                                tone="workspace"
	                                size="compact"
	                              />
	                              <ToolbarButton
	                                label="Cancel"
	                                tooltip="Cancel cut mode and keep the timeline unchanged."
	                                guidedMode={guidedMode}
	                                isDark={isDark}
	                                onClick={handleActivateCutMode}
	                                icon={CircleX}
	                                emphasized={activeWorkflowStep === 'clean'}
	                                tone="workspace"
	                                size="compact"
	                              />
	                            </div>
	                          ) : null}
	                        </div>
	                        <ToolbarButton
	                          label="Split"
	                          tooltip="Split the selected chapter at the playhead."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={() => {
	                            void handleSplitAtPlayhead()
	                          }}
	                          icon={Split}
	                          disabled={!selectedSegment || !hasSingleSelectedSegment}
	                          emphasized={activeWorkflowStep === 'clean'}
	                          tone="workspace"
	                        />
	                        <ToolbarButton
	                          label="Merge"
	                          tooltip="Merge works when two or more adjacent chapters are selected on the timeline. Use Shift-click for a range, or Cmd/Ctrl-click to add chapters to the selection."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={() => {
	                            void handleMergeSelectedClips()
	                          }}
	                          icon={Clapperboard}
	                          disabled={!canMergeSelectedSegments}
	                          emphasized={activeWorkflowStep === 'clean'}
	                          tone="workspace"
	                        />
	                        <ToolbarButton
	                          label="Delete"
	                          tooltip="Delete the selected chapter from the timeline."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={handleDeleteSelectedClip}
	                          icon={Trash2}
	                          disabled={!selectedSegment || !hasSingleSelectedSegment}
	                          danger
	                          emphasized={activeWorkflowStep === 'clean'}
	                          tone="workspace"
	                        />
	                        <ToolbarButton
	                          label="Arrange"
	                          tooltip="Enable drag-and-drop so you can reorder chapters directly on the timeline."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={handleToggleArrangeMode}
	                          icon={Files}
	                          active={isArrangeModeEnabled}
	                          emphasized={activeWorkflowStep === 'clean'}
	                          tone="workspace"
	                        />
	                        <ToolbarButton
	                          label="Undo"
	                          tooltip="Undo your last change."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={() => {
	                            void handleUndo()
	                          }}
	                          icon={RotateCcw}
	                          disabled={history.length === 0}
	                          emphasized={activeWorkflowStep === 'clean'}
	                          tone="global"
	                        />
	                        <ToolbarButton
	                          label="Redo"
	                          tooltip="Redo the last change you undid."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={() => {
	                            void handleRedo()
	                          }}
	                          icon={Redo2}
	                          disabled={redoHistory.length === 0}
	                          emphasized={activeWorkflowStep === 'clean'}
	                          tone="global"
	                        />
	                      </div>
	                      <span
	                        className={`my-2 w-px self-stretch ${
	                          isDark ? 'bg-[#31415a]' : 'bg-[#d9dde5]'
	                        }`}
	                        aria-hidden="true"
	                      />

	                      <div
	                        className="flex items-start gap-1 px-1 py-1"
	                      >
	                        <ToolbarButton
	                          label="Silencer"
	                          tooltip="Find silent parts you may want to remove."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={openSilenceReviewPanel}
	                          icon={Mic}
	                          active={rightPanelView === 'silence' && !isRightPanelCollapsed}
	                          emphasized={activeWorkflowStep === 'polish'}
	                          tone="editor"
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
	                          active={rightPanelView === 'subtitles' && !isRightPanelCollapsed}
	                          emphasized={activeWorkflowStep === 'polish'}
	                          tone="workspace"
	                        />
	                      </div>
	                      <span
	                        className={`my-2 w-px self-stretch ${
	                          isDark ? 'bg-[#31415a]' : 'bg-[#d9dde5]'
	                        }`}
	                        aria-hidden="true"
	                      />

	                      <div
	                        className="flex items-start gap-1 px-1 py-1"
	                      >
	                        <ToolbarButton
	                          label="Chapters"
	                          tooltip="Split the video into chapters and rename each chapter."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={handleOpenChaptersPanel}
	                          icon={Clapperboard}
	                          active={rightPanelView === 'chapters' && !isRightPanelCollapsed}
	                          emphasized={activeWorkflowStep === 'chapters'}
	                          tone="workspace"
	                        />
	                      </div>
	                      <span
	                        className={`my-2 w-px self-stretch ${
	                          isDark ? 'bg-[#31415a]' : 'bg-[#d9dde5]'
	                        }`}
	                        aria-hidden="true"
	                      />

	                      <div
	                        className="flex items-start gap-1 px-1 py-1"
	                      >
	                        <ToolbarButton
	                          label="Done"
	                          tooltip="Open final save, archive, export, and course actions."
	                          guidedMode={guidedMode}
	                          isDark={isDark}
	                          onClick={handleOpenDonePanel}
	                          icon={Check}
	                          active={rightPanelView === 'done' && !isRightPanelCollapsed}
	                          emphasized={activeWorkflowStep === 'course'}
	                          tone="global"
	                        />
	                      </div>
                    </div>
                  </div>
                </div>

                {subtitleError ? (
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-2">
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
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-2">
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
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-2">
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
                  <div className="mx-auto w-full max-w-[1040px] px-4 pb-2">
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

                <div className="mx-auto w-full max-w-[1040px] px-4 pb-2.5">
                  <div
                    className={`rounded-[20px] border px-3 py-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] ${
                      isDark
                        ? 'border-[#243149] bg-[#0f172a]'
                        : 'border-[#d9dde5] bg-white'
                    }`}
                  >
                    <div ref={timelineScrollRef} className="overflow-x-auto pb-1">
                      <div className="relative min-w-full" style={{ width: `${timelineZoom * 100}%` }}>
                        <div className="relative">
                          <div
                            ref={timelineTrackRef}
                            className="relative"
                            onPointerDown={(event) => {
                              if (isCutModeEnabled) return
                              seekTimelineFromClientX(event.clientX)
                              setIsTimelineDragging(true)
                            }}
                          >
                            <div
                              className={`relative flex min-h-[58px] items-stretch overflow-hidden rounded-xl border ${
                                isDark
                                  ? 'border-[#2b3950] bg-[#1a2435]'
                                  : 'border-[#dfe5ec] bg-[#eff3f8]'
                              }`}
                            >
                              {segments.map((segment) => {
                                const duration = Math.max(0.1, getClipDuration(segment))
                                const isPrimarySelected = selectedId === segment.id
                                const isSelected = selectedSegmentIdSet.has(segment.id)
                                const isDragTarget =
                                  isArrangeModeEnabled &&
                                  dragOverSegmentId === segment.id &&
                                  draggedSegmentId !== segment.id
                                const segmentFrames = getSegmentTimelineFrames(
                                  timelineThumbnails,
                                  segment,
                                )
                                const selectionStripeClasses = isPrimarySelected
                                  ? 'bg-white'
                                  : isSelected
                                    ? isDark
                                      ? 'bg-[#8bb8ff]'
                                      : 'bg-[#1a56db]'
                                    : ''
                                const clipFrameClasses = isPrimarySelected
                                  ? isDark
                                    ? 'z-20 border-white bg-[#1f4da0] text-white shadow-[inset_0_0_0_3px_rgba(255,255,255,0.95),inset_0_0_0_7px_rgba(222,52,171,0.95)]'
                                    : 'z-20 border-[#0b2f75] bg-[#1a56db] text-white shadow-[inset_0_0_0_3px_rgba(255,255,255,0.96),inset_0_0_0_7px_rgba(222,52,171,0.96)]'
                                  : isSelected
                                    ? isDark
                                      ? 'z-10 border-[#8bb8ff] bg-[#182238] text-[#edf2ff] shadow-[inset_0_0_0_3px_rgba(139,184,255,0.92)]'
                                      : 'z-10 border-[#1a56db] bg-[#eef3ff] text-[#003fb1] shadow-[inset_0_0_0_3px_rgba(26,86,219,0.92)]'
                                    : isDark
                                      ? 'border-[#344561] bg-[#101a2a] text-[#d6deec] hover:border-[#8bb8ff] hover:shadow-[inset_0_0_0_2px_rgba(139,184,255,0.32)]'
                                      : 'border-[#c9d5e8] bg-white text-[#233147] hover:border-[#1a56db] hover:shadow-[inset_0_0_0_2px_rgba(26,86,219,0.24)]'
                                const checkboxClasses = isPrimarySelected
                                  ? 'border-white bg-white text-[#1a56db]'
                                  : isDark
                                    ? 'border-[#8bb8ff] bg-[#0f172a] text-[#8bb8ff]'
                                    : 'border-[#1a56db] bg-white text-[#1a56db]'

                                return (
                                  <button
                                    key={segment.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    aria-label={`${segment.label}${isPrimarySelected ? ', active clip selected' : isSelected ? ', clip selected' : ''}`}
                                    draggable={isArrangeModeEnabled}
                                    onDragStart={(event) => {
                                      if (!isArrangeModeEnabled) {
                                        event.preventDefault()
                                        return
                                      }

                                      setDraggedSegmentId(segment.id)
                                      setDragOverSegmentId(segment.id)
                                      event.dataTransfer.effectAllowed = 'move'
                                      event.dataTransfer.setData(
                                        'text/plain',
                                        `${segment.id}`,
                                      )
                                    }}
                                    onDragOver={(event) => {
                                      if (!isArrangeModeEnabled || draggedSegmentId == null) {
                                        return
                                      }

                                      event.preventDefault()
                                      event.dataTransfer.dropEffect = 'move'
                                      setDragOverSegmentId(segment.id)
                                    }}
                                    onDrop={(event) => {
                                      if (!isArrangeModeEnabled || draggedSegmentId == null) {
                                        return
                                      }

                                      event.preventDefault()
                                      handleReorderSegment(draggedSegmentId, segment.id)
                                      setDraggedSegmentId(null)
                                      setDragOverSegmentId(null)
                                    }}
                                    onDragEnd={() => {
                                      setDraggedSegmentId(null)
                                      setDragOverSegmentId(null)
                                    }}
                                    onPointerDown={(event) => {
                                      if (isCutModeEnabled) {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        return
                                      }

                                      if (isArrangeModeEnabled) {
                                        event.stopPropagation()
                                        return
                                      }

                                      if (
                                        event.pointerType === 'mouse' &&
                                        event.button !== 0
                                      ) {
                                        return
                                      }

                                      event.stopPropagation()
                                      const isModifierSelection =
                                        event.shiftKey ||
                                        event.ctrlKey ||
                                        event.metaKey

                                      if (isModifierSelection) {
                                        event.preventDefault()
                                        handleTimelineClipSelection(segment.id, {
                                          extendSelection: event.shiftKey,
                                          toggleSelection:
                                            event.ctrlKey || event.metaKey,
                                        })
                                        return
                                      }

                                      const bounds =
                                        event.currentTarget.getBoundingClientRect()
                                      const ratio = clamp(
                                        (event.clientX - bounds.left) / bounds.width,
                                        0,
                                        1,
                                      )
                                      const nextTime = mapClipEditedOffsetToSourceTime(
                                        segment,
                                        getClipDuration(segment) * ratio,
                                      )
                                      selectSingleClip(segment.id)
                                      handleSeek(nextTime)
                                      setIsTimelineDragging(true)
                                    }}
                                    style={{ flexGrow: duration, flexBasis: 0 }}
                                    className={`relative flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-xl border text-left transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                                      isDragTarget
                                        ? isDark
                                          ? 'border-[#ffb3de] bg-[#2a1730] text-[#ffecf7] ring-2 ring-[#ff7ac8]/70'
                                          : 'border-[#de34ab] bg-[#fff0f8] text-[#a20f66] ring-2 ring-[#de34ab]/35'
                                        : ''
                                    } ${
                                      isDark
                                        ? 'focus-visible:ring-[#8bb8ff] focus-visible:ring-offset-[#1a2435]'
                                        : 'focus-visible:ring-[#003fb1] focus-visible:ring-offset-white'
                                    } ${clipFrameClasses} ${isArrangeModeEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                  >
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
                                      {isSelected ? (
                                        <>
                                          <div
                                            className={`absolute inset-y-0 left-0 w-1.5 ${selectionStripeClasses}`}
                                          />
                                        </>
                                      ) : null}
                                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.62))]" />
                                    </div>

                                    {isSelected ? (
                                      <span
                                        className={`pointer-events-none absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-md border-2 shadow-[0_8px_18px_rgba(15,23,42,0.24)] ${checkboxClasses}`}
                                        aria-hidden="true"
                                      >
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      </span>
                                    ) : null}

                                    <div className="relative z-10 px-2 py-1.5">
                                      <div className="px-1.5 py-1.5 drop-shadow-[0_2px_8px_rgba(15,23,42,0.55)]">
                                        <span className="block min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.16em]">
                                          {segment.label}
                                        </span>
                                        <span
                                          className={`mt-0.5 block text-[10px] ${
                                            isSelected
                                              ? isPrimarySelected
                                                ? 'text-white'
                                                : isDark
                                                  ? 'text-[#edf5ff]'
                                                  : 'text-white'
                                              : isDark
                                                ? 'text-[#d6deec]'
                                                : 'text-white/95'
                                          }`}
                                        >
                                          Source {formatClipSourceRange(segment)}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                              {!isCutModeEnabled &&
                              editedDuration > 0 &&
                              activeTimelineSegment ? (
                                <div className="pointer-events-none absolute inset-0 z-20">
                                  <span
                                    className="absolute inset-y-1 w-0.5 -translate-x-1/2 bg-[#de34ab]"
                                    style={{ left: `${timelinePlayheadRatio * 100}%` }}
                                  />
                                  <span
                                    className="absolute top-1 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[8px] border-x-transparent border-b-[#de34ab]"
                                    style={{ left: `${timelinePlayheadRatio * 100}%` }}
                                  />
                                  <span
                                    className="absolute bottom-5 rounded-full bg-[#111827] px-2 py-0.5 text-[9px] font-mono text-white shadow-sm"
                                    style={getTimelineTimestampStyle(timelinePlayheadRatio)}
                                  >
                                    {formatEditableTimestamp(timelinePlayheadEditedTime)}
                                  </span>
                                </div>
                              ) : null}
                              {isCutModeEnabled &&
                              canCutSelectedSegments &&
                              editedDuration > 0 &&
                              selectedTimelineLayouts.length > 0 ? (
                                <div className="absolute inset-0 z-30">
                                  {selectedTimelineLayouts.map((layout) => {
                                    if (
                                      layout.selectedStart == null ||
                                      layout.selectedEnd == null ||
                                      layout.duration <= 0
                                    ) {
                                      return null
                                    }

                                    const leftRatio =
                                      editedDuration > 0
                                        ? layout.globalStart / editedDuration
                                        : 0
                                    const widthRatio =
                                      editedDuration > 0
                                        ? layout.duration / editedDuration
                                        : 0
                                    const overlapStart = Math.max(
                                      normalizedCutRange.start,
                                      layout.selectedStart,
                                    )
                                    const overlapEnd = Math.min(
                                      normalizedCutRange.end,
                                      layout.selectedEnd,
                                    )
                                    const leftShadeWidth =
                                      ((overlapStart - layout.selectedStart) /
                                        layout.duration) *
                                      100
                                    const keepWidth =
                                      overlapEnd > overlapStart
                                        ? ((overlapEnd - overlapStart) / layout.duration) *
                                          100
                                        : 0
                                    const rightShadeWidth = Math.max(
                                      0,
                                      100 - leftShadeWidth - keepWidth,
                                    )

                                    return (
                                      <div
                                        key={`cut-overlay-${layout.segmentId}`}
                                        className="absolute inset-y-0"
                                        style={{
                                          left: `${leftRatio * 100}%`,
                                          width: `${widthRatio * 100}%`,
                                        }}
                                        onPointerDown={(event) => {
                                          event.preventDefault()
                                          event.stopPropagation()
                                          beginCutTimelineInteraction(event.clientX)
                                        }}
                                      >
                                        <div
                                          className="absolute inset-y-0 left-0 bg-[#0b1220]/30"
                                          style={{ width: `${Math.max(0, leftShadeWidth)}%` }}
                                        />
                                        <div
                                          className="absolute inset-y-0 bg-[#de34ab]/14"
                                          style={{
                                            left: `${Math.max(0, leftShadeWidth)}%`,
                                            width: `${Math.max(0, keepWidth)}%`,
                                          }}
                                        />
                                        <div
                                          className="absolute inset-y-0 right-0 bg-[#0b1220]/30"
                                          style={{
                                            width: `${Math.max(0, rightShadeWidth)}%`,
                                          }}
                                        />
                                      </div>
                                    )
                                  })}

                                  {(
                                    [
                                      ['start', normalizedCutRange.start],
                                      ['end', normalizedCutRange.end],
                                    ] as const
                                  ).map(([handle, value]) => {
                                    const handleRatio =
                                      handle === 'start' ? cutRangeStartRatio : cutRangeEndRatio

                                    return (
                                      <React.Fragment key={handle}>
                                        <button
                                          type="button"
                                          onPointerDown={(event) => {
                                            event.preventDefault()
                                            event.stopPropagation()
                                            setActiveCutHandle(handle)
                                            updateCutHandleFromClientX(handle, event.clientX)
                                          }}
                                          className="absolute inset-y-0 z-40 -translate-x-1/2 cursor-ew-resize"
                                          style={{ left: `${handleRatio * 100}%` }}
                                          aria-label={`${handle} cut playhead`}
                                        >
                                          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[#de34ab]" />
                                          <span className="absolute bottom-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#de34ab] shadow-[0_8px_20px_rgba(222,52,171,0.24)]" />
                                        </button>
                                        <span
                                          className="pointer-events-none absolute bottom-7 z-40 rounded-full bg-[#111827] px-2 py-0.5 text-[9px] font-mono text-white shadow-sm"
                                          style={getTimelineTimestampStyle(handleRatio)}
                                        >
                                          {formatEditableTimestamp(value)}
                                        </span>
                                      </React.Fragment>
                                    )
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-2 px-1">
                            <div
                              className={`relative h-5 overflow-hidden rounded-lg border ${
                                isDark
                                  ? 'border-[#2b3950] bg-[#101827]'
                                  : 'border-[#dfe5ec] bg-[#f6f8fb]'
                              }`}
                              onPointerDown={(event) => {
                                if (event.pointerType === 'mouse' && event.button !== 0) {
                                  return
                                }

                                const bounds = event.currentTarget.getBoundingClientRect()
                                const ratio = clamp(
                                  (event.clientX - bounds.left) / bounds.width,
                                  0,
                                  1,
                                )
                                handleSeekOriginal(ratio * totalDuration, true)
                              }}
                            >
                              {originalTimelineSections.map((section, index) => {
                                const left = totalDuration > 0 ? (section.start / totalDuration) * 100 : 0
                                const width =
                                  totalDuration > 0
                                    ? ((section.end - section.start) / totalDuration) * 100
                                    : 0

                                return (
                                  <div
                                    key={`${section.kind}-${section.start}-${section.end}-${index}`}
                                    className={`absolute inset-y-0 ${
                                      section.kind === 'kept'
                                        ? isDark
                                          ? 'bg-[linear-gradient(90deg,#4b86e5_0%,#6fa8ff_100%)]'
                                          : 'bg-[linear-gradient(90deg,#1a56db_0%,#5d8fff_100%)]'
                                        : isDark
                                          ? 'bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.18)_0px,rgba(148,163,184,0.18)_4px,rgba(15,23,42,0.05)_4px,rgba(15,23,42,0.05)_8px)]'
                                          : 'bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.38)_0px,rgba(148,163,184,0.38)_4px,rgba(255,255,255,0.82)_4px,rgba(255,255,255,0.82)_8px)]'
                                    }`}
                                    style={{
                                      left: `${left}%`,
                                      width: `${Math.max(width, 0)}%`,
                                    }}
                                  />
                                )
                              })}

                              {originalTimelineMarkers.map((marker) => (
                                <span
                                  key={marker}
                                  className={`absolute inset-y-0 w-px -translate-x-1/2 ${
                                    isDark ? 'bg-white/70' : 'bg-[#1a56db]'
                                  }`}
                                  style={{
                                    left: `${(marker / totalDuration) * 100}%`,
                                  }}
                                />
                              ))}

                              {totalDuration > 0 ? (
                                <div className="pointer-events-none absolute inset-0 z-20">
                                  <span
                                    className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[#de34ab]"
                                    style={{ left: `${sourcePlayheadRatio * 100}%` }}
                                  />
                                  <span
                                    className="absolute top-0 h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[7px] border-x-transparent border-b-[#de34ab]"
                                    style={{ left: `${sourcePlayheadRatio * 100}%` }}
                                  />
                                  <span
                                    className="absolute -top-6 rounded-full bg-[#111827] px-2 py-0.5 text-[9px] font-mono text-white shadow-sm"
                                    style={getTimelineTimestampStyle(sourcePlayheadRatio)}
                                  >
                                    {formatEditableTimestamp(currentTime)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="pt-1">
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
          className={`hidden min-h-0 overflow-visible border-l px-4 py-4 xl:flex xl:flex-col ${
            isDark
              ? 'border-[#243149] bg-[#121a2b]'
              : 'border-[#d9dde5] bg-white'
          }`}
        >
	          <div
	            className={`mb-3 flex items-center gap-2 ${
	              isRightPanelCollapsed ? 'justify-center' : 'justify-between'
	            }`}
	          >
	            {!isRightPanelCollapsed ? (
	              <div className="flex items-center gap-2">
                {rightPanelView === 'silence' ? (
                  <Mic className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                ) : rightPanelView === 'chapters' ? (
                  <Clapperboard className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                ) : rightPanelView === 'subtitles' ? (
                  <Subtitles className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
                ) : rightPanelView === 'done' ? (
                  <Check className={`h-4 w-4 ${isDark ? 'text-[#8bb8ff]' : 'text-[#003fb1]'}`} />
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
                    : rightPanelView === 'chapters'
                      ? 'Chapters'
                    : rightPanelView === 'subtitles'
                      ? 'Subtitles'
                    : rightPanelView === 'done'
                      ? 'Done'
                      : 'AI Workspace'}
                </h2>
              </div>
	            ) : null}

	            <button
	              type="button"
	              onClick={handleToggleRightPanelCollapsed}
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

	          {isRightPanelCollapsed ? null : (
            <div
              className={`flex min-h-0 flex-1 flex-col rounded-[22px] border p-4 ${
                isDark
                  ? 'border-[#31415a] bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]'
                  : 'border-[#d9dde5] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fb_100%)]'
              }`}
            >
                {rightPanelView === 'silence' ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-visible">
                  <div
                    className={`relative z-20 mb-4 overflow-visible rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <ToolbarButton
                        label="Detect"
                        tooltip="Run silence detection again on the current video or edit."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={() => {
                          void handleDetectSilence()
                        }}
                        icon={Mic}
                        disabled={silenceStatus === 'processing'}
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="Select All"
                        tooltip="Select every detected silence range in the list."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleSelectAllSilences}
                        icon={Files}
                        disabled={silenceReviewItems.length === 0}
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="Clear"
                        tooltip="Clear the current silence selection."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={handleClearSelectedSilences}
                        icon={RotateCcw}
                        disabled={selectedSilenceSegmentKeys.length === 0}
                        tone="workspace"
                      />
                      <ToolbarButton
                        label="Delete"
                        tooltip="Delete all selected silence ranges from the current edit."
                        guidedMode={guidedMode}
                        isDark={isDark}
                        onClick={() => {
                          void handleDeleteSelectedSilences()
                        }}
                        icon={Trash2}
                        disabled={selectedSilenceSegmentKeys.length === 0}
                        danger
                        tone="workspace"
                      />
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
                        No silence ranges to review yet. Click Detect to inspect
                        the full video when untouched, or all clips in the
                        current edit after you make timeline changes.
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
                              {selectedSilenceCount > 0
                                ? `${selectedSilenceCount} ready to delete`
                                : 'Select one or more silence ranges to delete'}
                            </span>
                          </div>
                        </div>

                        {silenceReviewItems.map((segment) => {
                          const isSelected = selectedSilenceSegmentKeys.includes(segment.key)
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
                                    {formatClipSourceRange(segment)}
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
                                </div>
                                <p
                                  className={`mt-2 text-[12px] leading-5 ${
                                    isDark ? 'text-[#c6d3eb]' : 'text-[#515f74]'
                                  }`}
                                >
                                  Duration: {(segment.end - segment.start).toFixed(1)}s
                                  {' · '}
                                  {isSelected
                                    ? 'Selected for deletion'
                                    : 'Not selected for deletion'}
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
              ) : rightPanelView === 'chapters' ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-visible">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {segments.length === 0 ? (
                      <div
                        className={`rounded-2xl border border-dashed px-5 py-5 text-[12px] leading-6 ${
                          isDark
                            ? 'border-[#31415a] bg-[#111827] text-[#8fa2c2]'
                            : 'border-[#c3c5d7] bg-[#fbfcfd] text-[#737686]'
                        }`}
                      >
                        Upload a video to start creating chapters.
                      </div>
                    ) : (
                      <div className="space-y-3 overflow-y-auto pr-1">
                        {segments.map((segment, index) => {
                          const isSelected = selectedSegmentIdSet.has(segment.id)
                          return (
                            <div
                              key={segment.id}
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
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                      isDark
                                        ? 'bg-[#1e293b] text-[#c6d3eb]'
                                        : 'bg-[#f2f4f6] text-[#515f74]'
                                    }`}
                                  >
                                    Chapter {index + 1}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-mono ${
                                      isDark
                                        ? 'bg-[#0f172a] text-[#9fb0ca]'
                                        : 'bg-white text-[#57657a]'
                                    }`}
                                  >
                                    {formatClipSourceRange(segment)}
                                  </span>
                                </div>

                                <label className="block">
                                  <span
                                    className={`mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] ${
                                      isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'
                                    }`}
                                  >
                                    Chapter Name
                                  </span>
                                  <input
                                    type="text"
                                    value={getChapterNameDraft(segment, index)}
                                    onChange={(event) =>
                                      handleChapterNameDraftChange(
                                        segment.id,
                                        event.target.value,
                                      )
                                    }
                                    onBlur={() =>
                                      handleChapterNameDraftCommit(segment, index)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.currentTarget.blur()
                                      }
                                    }}
                                    className={`w-full rounded-2xl border px-4 py-3 text-[13px] outline-none transition ${
                                      isDark
                                        ? 'border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa]'
                                        : 'border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db]'
                                    }`}
                                  />
                                </label>
                                <label className="block">
                                  <span className={`mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] ${
                                    isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'
                                  }`}>Summary</span>
                                  <textarea
                                    value={chapterSummaryDrafts[segment.id] ?? ''}
                                    onChange={(event) =>
                                      setChapterSummaryDrafts((prev) => ({ ...prev, [segment.id]: event.target.value }))
                                    }
                                    className={`w-full rounded-2xl border px-4 py-3 text-[12px] outline-none transition ${
                                      isDark
                                        ? 'border-[#31415a] bg-[#0f172a] text-[#edf2ff] focus:border-[#60a5fa]'
                                        : 'border-[#d9dde5] bg-white text-[#191c1e] focus:border-[#1a56db]'
                                    }`}
                                  />
                                </label>
                                {(() => {
                                  const thumbnailTimeDraft =
                                    chapterThumbnailDrafts[segment.id] ??
                                    formatEditableTimestamp(getClipSourceStart(segment))
                                  const thumbnailSeconds =
                                    parseEditableTimestamp(thumbnailTimeDraft) ??
                                    getClipSourceStart(segment)
                                  const thumbnail = timelineThumbnails.reduce<TimelineThumbnail | null>(
                                    (closest, frame) => {
                                      const distance = Math.abs(frame.time - thumbnailSeconds)
                                      if (!closest) return frame
                                      const bestDistance = Math.abs(
                                        closest.time - thumbnailSeconds,
                                      )
                                      return distance < bestDistance ? frame : closest
                                    },
                                    null,
                                  )
                                  return thumbnail ? (
                                    <img
                                      src={thumbnail.src}
                                      alt={`Thumbnail for ${getChapterNameDraft(segment, index)}`}
                                      className="h-20 w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <p className={`text-[11px] ${isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'}`}>
                                      Thumbnail frame is unavailable.
                                    </p>
                                  )
                                })()}

                                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${
                                  isDark ? 'border-[#243149]' : 'border-[#e3e7ee]'
                                }">
                                  <p
                                    className={`text-[11px] ${
                                      isDark ? 'text-[#8fa2c2]' : 'text-[#637287]'
                                    }`}
                                  >
                                    {isSelected
                                      ? 'This chapter is currently selected.'
                                      : 'Select this chapter to edit or split it.'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => selectSingleClip(segment.id)}
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
                                      onClick={() => handleSeek(getClipSourceStart(segment))}
                                      className="rounded-full bg-[#003fb1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                                    >
                                      Go To
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                ) : rightPanelView === 'subtitles' ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-visible">
                  <div
                    className={`relative z-20 mb-4 overflow-visible rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    {subtitleSegments.length === 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <ToolbarButton
                          label="Add"
                          tooltip="Import an existing .srt or .vtt subtitle file."
                          guidedMode={guidedMode}
                          isDark={isDark}
                          onClick={handleSubtitleUploadClick}
                          icon={Upload}
                          disabled={subtitleEntryStatus !== 'idle'}
                          tone="workspace"
                        />
                        <ToolbarButton
                          label="Generate"
                          tooltip="Generate subtitles from the current video."
                          guidedMode={guidedMode}
                          isDark={isDark}
                          onClick={() => {
                            void handleGenerateSubtitlesFromPanel()
                          }}
                          icon={Subtitles}
                          disabled={subtitleEntryStatus !== 'idle'}
                          tone="workspace"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <ToolbarButton
                          label="Replace"
                          tooltip="Replace the current subtitles with another subtitle file."
                          guidedMode={guidedMode}
                          isDark={isDark}
                          onClick={handleSubtitleUploadClick}
                          icon={Upload}
                          tone="workspace"
                        />
                        <ToolbarButton
                          label="Remove"
                          tooltip="Remove all subtitles from the current edit."
                          guidedMode={guidedMode}
                          isDark={isDark}
                          onClick={handleRemoveSubtitles}
                          icon={Trash2}
                          danger
                          tone="workspace"
                        />
                        <ToolbarButton
                          label="SRT"
                          tooltip="Export the current subtitles as an .srt file."
                          guidedMode={guidedMode}
                          isDark={isDark}
                          onClick={() => handleExportSubtitle('srt')}
                          icon={Save}
                          disabled={subtitleSegments.length === 0}
                          tone="workspace"
                        />
                        <ToolbarButton
                          label="VTT"
                          tooltip="Export the current subtitles as a .vtt file."
                          guidedMode={guidedMode}
                          isDark={isDark}
                          onClick={() => handleExportSubtitle('vtt')}
                          icon={Save}
                          disabled={subtitleSegments.length === 0}
                          tone="workspace"
                        />
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
              ) : rightPanelView === 'done' ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-visible">
                  <div
                    className={`relative z-20 mb-4 overflow-visible rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleOpenVersionsModal()
                        }}
                        disabled={!selectedVideoFile && !editorSessionId}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isDark
                            ? 'border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]'
                            : 'border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]'
                        }`}
                      >
                        <History className="h-4 w-4" />
                        Save & Manage Versions
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDoneActionModal('save-draft')}
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
                        onClick={() => handleOpenDoneActionModal('archive-video')}
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
                          void handleExportSelectedClip()
                        }}
                        disabled={
                          exportStatus === 'processing' ||
                          editorStatus === 'syncing' ||
                          !selectedSegment ||
                          !hasSingleSelectedSegment ||
                          (!selectedVideoFile && !editorSessionId)
                        }
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isDark
                            ? 'border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]'
                            : 'border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]'
                        }`}
                      >
                        <Video className="h-4 w-4" />
                        {exportStatus === 'processing' && activeExportKind === 'clip'
                          ? 'Rendering Chapter...'
                          : 'Export Chapter'}
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
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003fb1] to-[#1a56db] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,63,177,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Video className="h-4 w-4" />
                        {exportStatus === 'processing' && activeExportKind === 'video'
                          ? 'Rendering Video...'
                          : 'Export Video'}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-2 ${
                      isDark
                        ? 'border-[#243149] bg-[#111827]'
                        : 'border-[#e3e7ee] bg-[#fbfcfd]'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDoneActionModal('add-existing-course')}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isDark
                            ? 'border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]'
                            : 'border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]'
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        Add Video to Existing Course
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDoneActionModal('add-new-course')}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          isDark
                            ? 'border border-[#31415a] bg-[#182238] text-[#c6d3eb] hover:bg-[#1d2a42] hover:text-[#edf2ff]'
                            : 'border border-[#d9dde5] bg-white text-[#515f74] hover:bg-[#f7f9fb] hover:text-[#003fb1]'
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        Add Video to New Course
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setAreAIQuickActionsVisible((isVisible) => !isVisible)
                      }
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                        isDark
                          ? 'bg-[#1b3566] text-[#9ec5ff] hover:bg-[#234178]'
                          : 'bg-[#eef3ff] text-[#003fb1] hover:bg-[#dce8ff]'
                      }`}
                      aria-pressed={areAIQuickActionsVisible}
                      aria-label={
                        areAIQuickActionsVisible
                          ? 'Hide AI quick suggestions'
                          : 'Show AI quick suggestions'
                      }
                      title={
                        areAIQuickActionsVisible
                          ? 'Hide AI quick suggestions'
                          : 'Show AI quick suggestions'
                      }
                    >
                      <Lightbulb className="h-5 w-5" />
                    </button>
                  </div>

                  {areAIQuickActionsVisible ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {AI_QUICK_ACTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          disabled={!videoSourceUrl && !selectedVideoFile}
                          onClick={() => {
                            setAiPromptDraft(item)
                          }}
                          className={`rounded-full border px-3 py-2 text-left text-[12px] transition ${
                            isDark
                              ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb] hover:border-[#4b6388] hover:bg-[#131f33]'
                              : 'border-[#d9dde5] bg-white text-[#515f74] hover:border-[#7aa4ff] hover:bg-[#f6f9ff]'
                          } disabled:cursor-not-allowed disabled:opacity-45`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}

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

                      {aiPendingSuggestion && (
                        <div className={`rounded-2xl border p-3 text-[12px] ${
                          isDark
                            ? 'border-[#31415a] bg-[#0f172a] text-[#c6d3eb]'
                            : 'border-[#d9dde5] bg-[#f8fbff] text-[#334155]'
                        }`}>
                          <p className="font-semibold">
                            Review AI suggestion ({aiPendingSuggestion.intent})
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-4">
                            {aiPendingSuggestion.operations.map((operation, index) => (
                              <li key={`${operation.action}-${index}`}>
                                {operation.action === 'remove' || operation.action === 'keep'
                                  ? `Keep chapter range ${operation.start ?? 'start'} to ${operation.end ?? 'end'}`
                                  : operation.action === 'split_at'
                                    ? `Split at ${operation.start ?? 'the suggested time'}`
                                    : operation.action === 'trim_silence'
                                      ? 'Remove long silent sections'
                                      : operation.action === 'add_subtitle'
                                        ? 'Generate subtitles for this video'
                                        : operation.action === 'suggest_chapter'
                                          ? 'Create chapter suggestions from transcript'
                                          : operation.action}
                              </li>
                            ))}
                          </ul>
                          {aiPendingSuggestion.notes.length > 0 && (
                            <p className="mt-2">
                              Notes: {aiPendingSuggestion.notes.join(' | ')}
                            </p>
                          )}
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={handleApplyAISuggestion}
                              disabled={isApplyingAISuggestion}
                              className="rounded-lg bg-[#003fb1] px-3 py-1.5 text-white"
                            >
                              {isApplyingAISuggestion ? 'Applying…' : 'Apply'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelAISuggestion}
                              className="rounded-lg border px-3 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      <div ref={aiChatEndRef} />
                    </div>

                    <div
                      className={`mt-4 rounded-2xl border px-3 py-2 text-[12px] font-semibold shadow-sm ${
                        aiRequestStatus === 'error'
                          ? isDark
                            ? 'border-[#7f1d1d] bg-[#2a1218] text-[#fecdd3]'
                            : 'border-[#fecaca] bg-[#fff1f2] text-[#9f1239]'
                          : aiRequestStatus === 'success'
                            ? isDark
                              ? 'border-[#1d4f3a] bg-[#10231b] text-[#bbf7d0]'
                              : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]'
                            : aiRequestStatus === 'sending'
                              ? isDark
                                ? 'border-[#1b3566] bg-[#102345] text-[#bfdbfe]'
                                : 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
                              : isDark
                                ? 'border-[#31415a] bg-[#111827] text-[#c6d3eb]'
                                : 'border-[#d9dde5] bg-[#f8fbff] text-[#334155]'
                      }`}
                    >
                      {aiRequestStatus === 'sending' && 'AI is preparing your suggestion...'}
                      {aiRequestStatus === 'success' && 'Suggestion is ready. Review it and choose Apply or Cancel.'}
                      {aiRequestStatus === 'error' && 'AI request failed. Please try again.'}
                      {aiRequestStatus === 'idle' && 'Enter your request and click Send.'}
                    </div>

                    <div
                      className={`mt-3 flex items-end gap-2 rounded-2xl border px-3 py-3 ${
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
                        disabled={
                          aiPromptDraft.trim().length === 0 ||
                          aiRequestStatus === 'sending' ||
                          (!videoSourceUrl && !selectedVideoFile)
                        }
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
                    {!videoSourceUrl && !selectedVideoFile && (
                      <p className="mt-1 text-[11px] font-medium text-amber-500">
                        Upload a video first to enable AI Workspace suggestions.
                      </p>
                    )}
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
