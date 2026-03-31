/**
 * @file types.ts
 * @description Shared subtitle-related TypeScript types for the editor.
 */

/**
 * @description Single subtitle segment with timing and text content.
 */
export interface SubtitleSegment {
  /** Unique identifier for the subtitle row. */
  id: string
  /** Start time in seconds from the beginning of the video. */
  start: number
  /** End time in seconds from the beginning of the video. */
  end: number
  /** Human-readable subtitle text to display on screen. */
  text: string
}
