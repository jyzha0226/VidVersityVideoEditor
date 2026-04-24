import type { AiPromptRequest, AiSuggestion } from './types'

const DEFAULT_API_URL = 'http://localhost:8787'

function resolveApiUrl(): string {
  const configured = (globalThis as typeof globalThis & {
    __VIDVERSITY_SUBTITLE_API__?: string
  }).__VIDVERSITY_SUBTITLE_API__

  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, '')
  }

  return DEFAULT_API_URL
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${resolveApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null

  if (!response.ok) {
    throw new Error(payload?.error || 'AI request failed.')
  }

  if (!payload) {
    throw new Error('AI request failed: empty response payload.')
  }

  return payload
}

export function requestAiEditCommand(
  input: AiPromptRequest,
): Promise<AiSuggestion> {
  return postJson<AiSuggestion>('/api/ai/edit-command', input)
}

export function requestAiChapterSuggestions(input: {
  videoDuration?: string | null
  transcript?: Array<{ start?: string; end?: string; text?: string }>
}): Promise<AiSuggestion> {
  return postJson<AiSuggestion>('/api/ai/chapter-suggestions', input)
}
