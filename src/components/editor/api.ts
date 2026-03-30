/**
 * @file api.ts
 * @description Frontend helpers for loading AI sidebar suggestions from the local API.
 */

const DEFAULT_AI_API_URL = 'http://localhost:8787'

/**
 * @description Allowed AI suggestion kinds shown in the sidebar.
 */
export type AISuggestionKind = 'scene' | 'silence' | 'transcript'

/**
 * @description Single AI suggestion record returned by the local API.
 */
export interface AISuggestion {
  id: string
  label: string
  timeRange: string
  description: string
  kind: AISuggestionKind
}

/**
 * @description Shared query builder so the three endpoints can stay consistent.
 */
function buildSuggestionQuery(durationInSeconds?: number | null): string {
  const params = new URLSearchParams()

  if (
    typeof durationInSeconds === 'number' &&
    Number.isFinite(durationInSeconds) &&
    durationInSeconds > 0
  ) {
    params.set('duration', durationInSeconds.toString())
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * @description Load one suggestion category from a local API endpoint.
 */
async function fetchSuggestionCategory(
  path: string,
  durationInSeconds?: number | null,
): Promise<AISuggestion[]> {
  const query = buildSuggestionQuery(durationInSeconds)
  const response = await fetch(`${DEFAULT_AI_API_URL}${path}${query}`)

  if (!response.ok) {
    throw new Error(`Failed to load AI suggestions from ${path}.`)
  }

  const payload = (await response.json()) as { suggestions?: AISuggestion[] }
  return Array.isArray(payload.suggestions) ? payload.suggestions : []
}

/**
 * @description Load scene-change suggestions from the local API.
 */
export function fetchSceneChangeSuggestions(
  durationInSeconds?: number | null,
): Promise<AISuggestion[]> {
  return fetchSuggestionCategory('/api/ai/scene-changes', durationInSeconds)
}

/**
 * @description Load silence-detection suggestions from the local API.
 */
export function fetchSilenceSuggestions(
  durationInSeconds?: number | null,
): Promise<AISuggestion[]> {
  return fetchSuggestionCategory('/api/ai/silence-segments', durationInSeconds)
}

/**
 * @description Load transcript-based edit suggestions from the local API.
 */
export function fetchTranscriptSuggestions(
  durationInSeconds?: number | null,
): Promise<AISuggestion[]> {
  return fetchSuggestionCategory(
    '/api/ai/transcript-suggestions',
    durationInSeconds,
  )
}

/**
 * @description Load all AI sidebar suggestions in one batch for the editor.
 */
export async function fetchAISuggestions(
  durationInSeconds?: number | null,
): Promise<AISuggestion[]> {
  const [sceneChanges, silenceSegments, transcriptSuggestions] =
    await Promise.all([
      fetchSceneChangeSuggestions(durationInSeconds),
      fetchSilenceSuggestions(durationInSeconds),
      fetchTranscriptSuggestions(durationInSeconds),
    ])

  return [
    ...sceneChanges,
    ...silenceSegments,
    ...transcriptSuggestions,
  ]
}
