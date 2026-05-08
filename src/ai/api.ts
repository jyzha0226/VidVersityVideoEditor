import type { AIEditCommandRequest, AIEditSuggestion } from './types'

const DEFAULT_SUBTITLE_API_URL = 'http://192.168.0.6:8787'

function resolveApiUrl() {
  const configured = (globalThis as typeof globalThis & {
    __VIDVERSITY_SUBTITLE_API__?: string
  }).__VIDVERSITY_SUBTITLE_API__

  return configured?.trim().replace(/\/$/, '') || DEFAULT_SUBTITLE_API_URL
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${resolveApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error || 'AI request failed.')
  }

  return body as T
}

export async function requestAIEditCommand(
  payload: AIEditCommandRequest,
): Promise<{ suggestion: AIEditSuggestion }> {
  return post('/api/ai/edit-command', payload)
}

export async function requestAIChapterSuggestions(payload: {
  videoDuration: string
  transcript: AIEditCommandRequest['transcript']
}): Promise<{ suggestion: AIEditSuggestion }> {
  return post('/api/ai/chapter-suggestions', payload)
}
