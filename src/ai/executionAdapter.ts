import type { AIEditSuggestion } from './types'

export interface AIExecutionContext {
  onRemoveRange?: (start: string | null, end: string | null) => void
  onSplitAt?: (start: string | null) => void
  onMuteRange?: (start: string | null, end: string | null) => void
  onAddSubtitle?: (start: string | null, end: string | null, text: string | null) => void
}

export function applyAISuggestionWithAdapters(
  suggestion: AIEditSuggestion,
  context: AIExecutionContext,
): string[] {
  const notes: string[] = []

  suggestion.operations.forEach((operation) => {
    switch (operation.action) {
      case 'remove':
        if (context.onRemoveRange) context.onRemoveRange(operation.start, operation.end)
        else notes.push('TODO: remove adapter not connected yet.')
        break
      case 'split_at':
        if (context.onSplitAt) context.onSplitAt(operation.start)
        else notes.push('TODO: split adapter not connected yet.')
        break
      case 'mute':
        if (context.onMuteRange) context.onMuteRange(operation.start, operation.end)
        else notes.push('Mute adapter placeholder: audio mute operation not connected yet.')
        break
      case 'add_subtitle':
        if (context.onAddSubtitle) {
          context.onAddSubtitle(operation.start, operation.end, operation.text)
        } else {
          notes.push('Subtitle adapter placeholder: subtitle insertion not connected yet.')
        }
        break
      case 'trim_silence':
        notes.push('Silence trimming requested. Connect to silence detection pipeline before applying.')
        break
      case 'suggest_chapter':
        notes.push('Chapter suggestion is review-only and should not edit the timeline automatically.')
        break
      default:
        notes.push(`Unsupported action: ${operation.action}`)
    }
  })

  return notes
}
