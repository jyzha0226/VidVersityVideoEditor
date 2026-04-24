export type AiIntent =
  | 'cut'
  | 'split'
  | 'merge'
  | 'mute'
  | 'subtitle'
  | 'trim_silence'
  | 'chapter_suggest'
  | 'unknown'

export type AiAction =
  | 'remove'
  | 'keep'
  | 'split_at'
  | 'mute'
  | 'add_subtitle'
  | 'trim_silence'
  | 'suggest_chapter'

export interface AiOperation {
  action: AiAction
  start: string | null
  end: string | null
  text: string | null
}

export interface AiChapterSuggestion {
  title: string
  start: string | null
  end: string | null
  summary: string
  thumbnailTime: string | null
}

export interface AiSuggestion {
  intent: AiIntent
  needs_review: true
  parameters: Record<string, unknown>
  operations: AiOperation[]
  chapters: AiChapterSuggestion[]
  notes: string[]
}

export interface AiPromptRequest {
  prompt: string
  videoDuration?: string | null
  transcript?: Array<{ start?: string; end?: string; text?: string }>
}
