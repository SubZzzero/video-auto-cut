
// Normalize one browser-reported duration to a safe whole-second value.
export function normalizeVideoDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Unable to determine the video duration.')
  }

  return Math.max(1, Math.floor(durationSeconds))
}


// Normalize one browser-reported frame size into safe whole pixels.
export function normalizeVideoDimension(value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Unable to determine the video duration.')
  }

  return Math.max(1, Math.round(value))
}


// Build one shared metadata object from browser video details.
export function normalizeVideoMetadata(video) {
  return {
    durationSeconds: normalizeVideoDuration(video.duration),
    sourceWidth: normalizeVideoDimension(video.videoWidth),
    sourceHeight: normalizeVideoDimension(video.videoHeight),
  }
}


// Load one local video's metadata through browser media inspection.
export function loadVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    // Release browser resources once metadata loading finishes.
    function cleanup() {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    // Resolve the sanitized metadata once it is available.
    function handleLoadedMetadata() {
      try {
        resolve(normalizeVideoMetadata(video))
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


// Preserve the existing duration-only helper for focused callers.
export async function loadVideoDuration(file) {
  const metadata = await loadVideoMetadata(file)
  return metadata.durationSeconds
}
