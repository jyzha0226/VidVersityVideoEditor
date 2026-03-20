/**
 * @file types.ts
 * @description Shared type definitions for the timeline components.
 */

/**
 * @description Represents a simple timeline clip segment for demo editing tools.
 */
export interface ClipSegment {
  id: number
  label: string
  start: number
  end: number
}
