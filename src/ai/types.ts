export type AIIntent =
  | 'cut'
  | 'split'
  | 'merge'
  | 'mute'
  | 'subtitle'
  | 'trim_silence'
  | 'chapter_suggest'
  | 'unknown'

export type AIOperationAction =
  | 'remove'
  | 'keep'
  | 'split_at'
  | 'mute'
  | 'add_subtitle'
  | 'trim_silence'
  | 'suggest_chapter'

export interface TranscriptSegment {
  start: string | null
  end: string | null
  text: string
}

export interface AISuggestedOperation {
  action: AIOperationAction
  start: string | null
  end: string | null
  text: string | null
}

export interface AISuggestedChapter {
  title: string
  start: string | null
  end: string | null
  summary?: string
  thumbnailTime?: string | null
}

export interface AIEditSuggestion {
  intent: AIIntent
  needs_review: true
  parameters: Record<string, unknown>
  operations: AISuggestedOperation[]
  chapters: AISuggestedChapter[]
  notes: string[]
}

export interface AIEditCommandRequest {
  prompt: string
  videoDuration: string
  transcript: TranscriptSegment[]
}
