import type { AiSuggestion } from './types'

export interface AiExecutionContext {
  onRemoveRange?: (start: string | null, end: string | null) => Promise<void>
  onSplitAt?: (start: string | null) => Promise<void>
  onAddSubtitle?: (
    start: string | null,
    end: string | null,
    text: string | null,
  ) => Promise<void>
}

export interface AiExecutionResult {
  applied: string[]
  skipped: string[]
}

export async function applyAiSuggestion(
  suggestion: AiSuggestion,
  context: AiExecutionContext,
): Promise<AiExecutionResult> {
  const applied: string[] = []
  const skipped: string[] = []

  for (const operation of suggestion.operations) {
    if (operation.action === 'remove') {
      if (!context.onRemoveRange) {
        skipped.push('remove: no remove adapter connected yet')
        continue
      }
      await context.onRemoveRange(operation.start, operation.end)
      applied.push(`remove ${operation.start ?? '?'} - ${operation.end ?? '?'}`)
      continue
    }

    if (operation.action === 'split_at') {
      if (!context.onSplitAt) {
        skipped.push('split_at: no split adapter connected yet')
        continue
      }
      await context.onSplitAt(operation.start)
      applied.push(`split_at ${operation.start ?? '?'}`)
      continue
    }

    if (operation.action === 'add_subtitle') {
      if (!context.onAddSubtitle) {
        skipped.push('add_subtitle: no subtitle adapter connected yet')
        continue
      }
      await context.onAddSubtitle(operation.start, operation.end, operation.text)
      applied.push(`add_subtitle ${operation.start ?? '?'} - ${operation.end ?? '?'}`)
      continue
    }

    if (operation.action === 'mute') {
      skipped.push('mute: TODO adapter not connected yet')
      continue
    }

    if (operation.action === 'trim_silence') {
      skipped.push('trim_silence: TODO silence removal adapter not connected yet')
      continue
    }

    if (operation.action === 'suggest_chapter') {
      skipped.push('suggest_chapter: review only, no timeline action applied')
      continue
    }

    skipped.push(`${operation.action}: unsupported operation`)
  }

  return { applied, skipped }
}
