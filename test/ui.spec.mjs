import { expect, test } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const FFMPEG_BIN = process.env.VIDVERSITY_FFMPEG_BIN || '/opt/homebrew/bin/ffmpeg'

function createFixtureVideo() {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'vidversity-ui-test-'))
  const outputPath = join(fixtureDir, 'fixture-ui.mp4')
  const result = spawnSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=640x360:rate=24:duration=3',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=900:sample_rate=44100:duration=3',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-shortest',
      outputPath,
    ],
    { encoding: 'utf8' },
  )

  if (result.status !== 0 || !existsSync(outputPath)) {
    throw new Error(
      `Could not generate UI fixture video. ffmpeg output: ${result.stderr || result.stdout}`,
    )
  }

  return outputPath
}

test('upload, split, and export video from UI', async ({ page }) => {
  const fixtureVideo = createFixtureVideo()
  await page.goto('/')

  const uploadInput = page.locator('input[type="file"][accept="video/*"]').first()
  await uploadInput.setInputFiles(fixtureVideo)

  // Wait for editor to initialize with uploaded media.
  await expect(page.getByText('Video loaded')).toBeVisible()
  await expect(page.getByText('Ready').first()).toBeVisible()

  // Move playhead to a safe split position (>1s and <end-1s).
  await page.locator('video').evaluate((element) => {
    const video = element
    video.currentTime = 1.5
    video.dispatchEvent(new Event('timeupdate'))
  })

  const splitButton = page.getByRole('button', { name: /^Split$/ }).first()
  await expect(splitButton).toBeEnabled()
  await splitButton.click()

  // After split, at least two chapters should be visible.
  await expect(page.getByText(/Chapter 2/i)).toBeVisible()

  const exportVideoButton = page.getByRole('button', { name: /Export Video/i })
  await expect(exportVideoButton).toBeEnabled()
  await exportVideoButton.click()
  await expect(page.getByRole('button', { name: /Rendering Video\.\.\./i })).toBeVisible()
})
