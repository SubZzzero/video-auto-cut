
// Normalize one browser-reported duration to a safe whole-second value.
export function normalizeVideoDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Unable to determine the video duration.')
  }

  return Math.max(1, Math.floor(durationSeconds))
}


// Load one local video's duration through browser metadata.
export function loadVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    // Release browser resources once metadata loading finishes.
    function cleanup() {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    // Resolve the sanitized duration once metadata is available.
    function handleLoadedMetadata() {
      try {
        resolve(normalizeVideoDuration(video.duration))
      } catch (error) {
        reject(error)
      } finally {
        cleanup()
      }
    }

    // Reject unreadable video files with one shared UI error.
    function handleError() {
      cleanup()
      reject(new Error('Unable to determine the video duration.'))
    }

    video.preload = 'metadata'
    video.onloadedmetadata = handleLoadedMetadata
    video.onerror = handleError
    video.src = objectUrl
  })
}
