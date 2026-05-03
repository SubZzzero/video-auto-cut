import { QUEUE_STATUS } from '../config/constants'

// Build one local queue item from an uploaded file.
export function createQueueItem(file, index) {
  return {
    id: `${file.name}-${file.lastModified}-${index}`,
    file,
    status: QUEUE_STATUS.queued,
    progress: 0,
    message: 'Waiting to start.',
    outputs: [],
    error: '',
    jobId: '',
  }
}

// Build queue items for all selected files.
export function createQueueItems(files) {
  return files.map((file, index) => createQueueItem(file, index))
}

// Derive the top-level UI state from the current queue.
export function deriveScreenState(queueItems, isRunning) {
  if (queueItems.length === 0) {
    return 'idle'
  }

  if (isRunning || queueItems.some((item) => item.status === QUEUE_STATUS.processing || item.status === QUEUE_STATUS.uploading)) {
    return 'loading'
  }

  if (queueItems.some((item) => item.status === QUEUE_STATUS.error)) {
    return 'error'
  }

  if (queueItems.every((item) => item.status === QUEUE_STATUS.success)) {
    return 'success'
  }

  return 'idle'
}

// Wait between poll requests without blocking the UI thread.
export function sleep(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}
