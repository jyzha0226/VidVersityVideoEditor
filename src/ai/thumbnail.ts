function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map((part) => Number(part.trim()))
  if (parts.some((part) => Number.isNaN(part))) {
    return 0
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  return 0
}

export async function captureThumbnailAtTime(
  videoElement: HTMLVideoElement,
  timestamp: string,
): Promise<string | null> {
  if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
    return null
  }

  const targetTime = Math.max(0, parseTimestampToSeconds(timestamp))

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const context = canvas.getContext('2d')

    if (!context) {
      resolve(null)
      return
    }

    const previousTime = videoElement.currentTime
    const restoreAndResolve = () => {
      videoElement.currentTime = previousTime
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }

    const onSeeked = () => {
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      videoElement.removeEventListener('seeked', onSeeked)
      restoreAndResolve()
    }

    videoElement.addEventListener('seeked', onSeeked, { once: true })
    videoElement.currentTime = Math.min(targetTime, videoElement.duration || targetTime)
  })
}
