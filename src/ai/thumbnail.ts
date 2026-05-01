export async function captureThumbnailAtTime(
  videoElement: HTMLVideoElement,
  timestamp: number,
): Promise<string> {
  if (!Number.isFinite(timestamp) || timestamp < 0) {
    throw new Error('Timestamp must be a non-negative number.')
  }

  const previousTime = videoElement.currentTime
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth || 320
  canvas.height = videoElement.videoHeight || 180

  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      videoElement.removeEventListener('seeked', onSeeked)
      resolve()
    }
    const onError = () => {
      videoElement.removeEventListener('error', onError)
      reject(new Error('Unable to seek video for thumbnail capture.'))
    }

    videoElement.addEventListener('seeked', onSeeked, { once: true })
    videoElement.addEventListener('error', onError, { once: true })
    videoElement.currentTime = Math.min(timestamp, videoElement.duration || timestamp)
  })

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context unavailable.')
  }

  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  videoElement.currentTime = previousTime
  return dataUrl
}
