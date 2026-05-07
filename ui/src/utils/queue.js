import { QUEUE_STATUS } from '../config/constants'

// Build one local queue item from an uploaded file.
export function createQueueItem(file, index, settings) {
  return {
    id: `${file.name}-${file.lastModified}-${index}`,
    file,
    crop: settings.crop,
    duration: settings.duration,
    startTime: settings.startTime,
    endTime: settings.endTime,
    durationSeconds: settings.durationSeconds,
    sourceWidth: settings.sourceWidth ?? 0,
    sourceHeight: settings.sourceHeight ?? 0,
    cropX: settings.cropX ?? null,
    cropY: settings.cropY ?? null,
    metadataError: settings.metadataError ?? '',
    status: QUEUE_STATUS.queued,
    progress: 0,
    message: 'Waiting to start.',
    outputs: [],
    error: '',
    jobId: '',
  }
}

// Build queue items for all selected files.
export function createQueueItems(files, buildSettings) {
  return files.map((file, index) => createQueueItem(file, index, buildSettings(file, index)))
}

// Wait between poll requests without blocking the UI thread.
export function sleep(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}
