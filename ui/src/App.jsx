import { useMemo, useRef, useState } from 'react'

import { cancelJob, createProcessJob, getJobStatus } from './api/client'
import './App.css'
import backgroundImage from '../../img/bg/bg.png'
import Controls from './components/Controls'
import FileUpload from './components/FileUpload'
import LanguageSwitcher from './components/LanguageSwitcher'
import QueueList from './components/QueueList'
import {
  DEFAULT_FORM_SETTINGS,
  DEFAULT_LANGUAGE,
  MIN_RANGE_DURATION_SECONDS,
  QUEUE_STATUS,
  STATUS_POLL_INTERVAL_MS,
} from './config/constants'
import { getTranslation } from './i18n/translations'
import {
  isPresetSelected,
  resolveCropPlacement,
  resolveCropPositionForPreset,
} from './utils/crop'
import { getErrorMessage } from './utils/errors'
import { createQueueItems, sleep } from './utils/queue'
import {
  parseClockInput,
  resolveEndTime,
  resolveStartTime,
} from './utils/time'
import { loadVideoMetadata } from './utils/video'

// Normalize a number input into a valid chunk duration.
function parseDuration(value) {
  const parsedValue = Number(value)
  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return 1
  }

  return parsedValue
}


// Build one default settings object for a file with known metadata.
function buildDefaultItemSettings(videoMetadata) {
  return {
    crop: DEFAULT_FORM_SETTINGS.crop,
    duration: DEFAULT_FORM_SETTINGS.duration,
    startTime: 0,
    endTime: videoMetadata.durationSeconds,
    durationSeconds: videoMetadata.durationSeconds,
    sourceWidth: videoMetadata.sourceWidth,
    sourceHeight: videoMetadata.sourceHeight,
    cropX: null,
    cropY: null,
    metadataError: '',
  }
}


// Build one fallback settings object when metadata loading fails.
function buildMetadataFallbackSettings() {
  return {
    ...buildDefaultItemSettings({
      durationSeconds: MIN_RANGE_DURATION_SECONDS,
      sourceWidth: 0,
      sourceHeight: 0,
    }),
    metadataError: '',
  }
}


// Resolve the next crop patch for one queue item and preset change.
function buildCropPresetPatch(item, nextCrop) {
  if (!isPresetSelected(nextCrop)) {
    return { crop: nextCrop, cropX: null, cropY: null }
  }

  if (item.sourceWidth <= 0 || item.sourceHeight <= 0) {
    return { crop: nextCrop, cropX: null, cropY: null }
  }

  const nextPosition = resolveCropPositionForPreset(
    item.sourceWidth,
    item.sourceHeight,
    item.crop,
    nextCrop,
    item.cropX,
    item.cropY,
  )
  return {
    crop: nextCrop,
    cropX: nextPosition.cropX,
    cropY: nextPosition.cropY,
  }
}


// Reconcile crop placement after fresh source metadata becomes available.
function buildMetadataPatch(item, sourceWidth, sourceHeight) {
  const basePatch = {
    sourceWidth,
    sourceHeight,
  }

  if (!isPresetSelected(item.crop)) {
    return basePatch
  }

  const placement = resolveCropPlacement(sourceWidth, sourceHeight, item.crop, item.cropX, item.cropY)
  return {
    ...basePatch,
    cropX: placement?.cropX ?? null,
    cropY: placement?.cropY ?? null,
  }
}


// Load per-file queue settings from local video metadata.
async function buildQueueItemsWithMetadata(files) {
  const settingsList = await Promise.all(
    files.map(async (file) => {
      try {
        const videoMetadata = await loadVideoMetadata(file)
        return buildDefaultItemSettings(videoMetadata)
      } catch (error) {
        return {
          ...buildMetadataFallbackSettings(),
          metadataError: getErrorMessage(error),
        }
      }
    }),
  )

  return createQueueItems(files, (_file, index) => settingsList[index])
}


// Check whether one queue item is ready to submit.
function isQueueItemReady(item) {
  return !item.metadataError && item.endTime > item.startTime && item.duration > 0
}

// Create the root application component.
export default function App() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [queueItems, setQueueItems] = useState([])
  const [activeItemId, setActiveItemId] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const currentProcessingItemIdRef = useRef('')
  const currentProcessingJobIdRef = useRef('')
  const batchCancelRequestedRef = useRef(false)

  const copy = getTranslation(language)
  const activeItem = useMemo(
    () => queueItems.find((item) => item.id === activeItemId) ?? queueItems[0] ?? null,
    [activeItemId, queueItems],
  )
  const hasFiles = queueItems.length > 0
  const canSubmit = queueItems.length > 0 && queueItems.every(isQueueItemReady)
  const canCancel = isRunning && activeItem?.id === currentProcessingItemIdRef.current && Boolean(currentProcessingJobIdRef.current)

  // Replace the queue when a new set of files is selected.
  async function handleFileChange(event) {
    const nextFiles = Array.from(event.target.files ?? [])
    const nextQueueItems = await buildQueueItemsWithMetadata(nextFiles)
    setQueueItems(nextQueueItems)
    setActiveItemId(nextQueueItems[0]?.id ?? '')
  }

  // Update the selected UI language.
  function handleLanguageChange(event) {
    setLanguage(event.target.value)
  }

  // Patch one queue item by id.
  function updateQueueItem(itemId, patch) {
    setQueueItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)))
  }

  // Reset processing-tracking state after one batch finishes.
  function resetProcessingState() {
    currentProcessingItemIdRef.current = ''
    currentProcessingJobIdRef.current = ''
    batchCancelRequestedRef.current = false
    setIsCancelling(false)
  }

  // Update the active queue item crop mode.
  function handleCropChange(event) {
    if (!activeItem) {
      return
    }

    updateQueueItem(activeItem.id, buildCropPresetPatch(activeItem, event.target.value))
  }

  // Update the active queue item crop coordinates from the preview overlay.
  function handleCropPositionChange(nextCropPosition) {
    if (!activeItem) {
      return
    }

    updateQueueItem(activeItem.id, nextCropPosition)
  }

  // Update source metadata for the active item from the rendered preview.
  function handleVideoMetadataChange(nextMetadata) {
    if (!activeItem) {
      return
    }

    if (nextMetadata.sourceWidth === activeItem.sourceWidth && nextMetadata.sourceHeight === activeItem.sourceHeight) {
      return
    }

    updateQueueItem(activeItem.id, buildMetadataPatch(activeItem, nextMetadata.sourceWidth, nextMetadata.sourceHeight))
  }

  // Update the active queue item chunk duration.
  function handleDurationChange(event) {
    if (!activeItem) {
      return
    }

    updateQueueItem(activeItem.id, { duration: parseDuration(event.target.value) })
  }

  // Update the active queue item start time from typed input.
  function handleStartTimeChange(event) {
    if (!activeItem) {
      return
    }

    const nextStartTime = resolveStartTime(
      parseClockInput(event.target.value),
      activeItem.endTime,
      activeItem.durationSeconds,
    )
    updateQueueItem(activeItem.id, { startTime: nextStartTime })
  }

  // Update the active queue item end time from typed input.
  function handleEndTimeChange(event) {
    if (!activeItem) {
      return
    }

    const nextEndTime = resolveEndTime(
      parseClockInput(event.target.value),
      activeItem.startTime,
      activeItem.durationSeconds,
    )
    updateQueueItem(activeItem.id, { endTime: nextEndTime })
  }

  // Update the active queue item start time from the timeline slider.
  function handleStartSliderChange(event) {
    if (!activeItem) {
      return
    }

    const nextStartTime = resolveStartTime(
      Number(event.target.value),
      activeItem.endTime,
      activeItem.durationSeconds,
    )
    updateQueueItem(activeItem.id, { startTime: nextStartTime })
  }

  // Update the active queue item end time from the timeline slider.
  function handleEndSliderChange(event) {
    if (!activeItem) {
      return
    }

    const nextEndTime = resolveEndTime(
      Number(event.target.value),
      activeItem.startTime,
      activeItem.durationSeconds,
    )
    updateQueueItem(activeItem.id, { endTime: nextEndTime })
  }

  // Poll the backend until one job completes or fails.
  async function waitForCompletion(itemId, jobId) {
    while (true) {
      const status = await getJobStatus(jobId)
      updateQueueItem(itemId, {
        cropX: status.cropX ?? null,
        cropY: status.cropY ?? null,
        status: status.status,
        progress: status.progress,
        message: status.message,
        outputs: status.outputs,
        error: status.error ?? '',
        jobId,
      })

      if (
        status.status === QUEUE_STATUS.success
        || status.status === QUEUE_STATUS.error
        || status.status === QUEUE_STATUS.cancelled
      ) {
        return status
      }

      await sleep(STATUS_POLL_INTERVAL_MS)
    }
  }

  // Process the current queue from top to bottom.
  async function handleStartProcessing() {
    const itemsToProcess = queueItems.map((item) => ({ ...item }))
    setIsRunning(true)
    batchCancelRequestedRef.current = false

    try {
      for (const item of itemsToProcess) {
        if (batchCancelRequestedRef.current) {
          break
        }

        currentProcessingItemIdRef.current = item.id
        currentProcessingJobIdRef.current = ''
        setActiveItemId(item.id)
        updateQueueItem(item.id, {
          status: QUEUE_STATUS.uploading,
          progress: 5,
          message: 'Uploading file.',
          error: '',
        })

        try {
          const createdJob = await createProcessJob(item.file, item)
          currentProcessingJobIdRef.current = createdJob.jobId
          updateQueueItem(item.id, {
            status: createdJob.status,
            progress: createdJob.progress,
            message: createdJob.message,
            jobId: createdJob.jobId,
          })
          const completedJob = await waitForCompletion(item.id, createdJob.jobId)
          currentProcessingJobIdRef.current = ''
          setIsCancelling(false)

          if (completedJob.status === QUEUE_STATUS.cancelled) {
            batchCancelRequestedRef.current = true
            break
          }
        } catch (error) {
          currentProcessingJobIdRef.current = ''
          setIsCancelling(false)

          if (batchCancelRequestedRef.current) {
            break
          }

          updateQueueItem(item.id, {
            status: QUEUE_STATUS.error,
            progress: 100,
            message: 'Processing failed.',
            error: getErrorMessage(error),
          })
        }
      }
    } finally {
      setIsRunning(false)
      resetProcessingState()
    }
  }

  // Cancel the currently running backend job and stop the remaining batch.
  async function handleCancelProcessing() {
    const itemId = currentProcessingItemIdRef.current
    const jobId = currentProcessingJobIdRef.current
    if (!itemId || !jobId || isCancelling) {
      return
    }

    setIsCancelling(true)

    try {
      const cancelledJob = await cancelJob(jobId)
      batchCancelRequestedRef.current = true
      updateQueueItem(itemId, {
        status: cancelledJob.status,
        progress: cancelledJob.progress,
        message: cancelledJob.message,
        outputs: cancelledJob.outputs,
        error: cancelledJob.error ?? '',
      })
    } catch (error) {
      setIsCancelling(false)
      updateQueueItem(itemId, {
        error: getErrorMessage(error),
      })
    }
  }

  return (
    <main
      className={`app-shell ${hasFiles ? 'app-shell-active' : 'app-shell-empty'}`}
      style={{ '--app-background-image': `url(${backgroundImage})` }}
    >
      <div className="app-background-layer" aria-hidden="true" />
      <header className="app-toolbar">
        <div className="app-branding">
          <span className="app-brand-mark">{copy.appTitle}</span>
          <p className="app-description">{copy.appDescription}</p>
        </div>
        <LanguageSwitcher language={language} onChange={handleLanguageChange} copy={copy} />
      </header>
      <section className="app-stage">
        <div className="app-grid">
          <FileUpload
            items={queueItems}
            activeItemId={activeItem?.id ?? ''}
            disabled={isRunning}
            onChange={handleFileChange}
            onSelect={setActiveItemId}
            copy={copy}
          />
          <Controls
            activeItem={activeItem}
            disabled={isRunning}
            canSubmit={canSubmit}
            canCancel={canCancel}
            isCancelling={isCancelling}
            onCropChange={handleCropChange}
            onCropPositionChange={handleCropPositionChange}
            onDurationChange={handleDurationChange}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            onStartSliderChange={handleStartSliderChange}
            onEndSliderChange={handleEndSliderChange}
            onVideoMetadataChange={handleVideoMetadataChange}
            onSubmit={handleStartProcessing}
            onCancel={handleCancelProcessing}
            copy={copy}
          />
          <QueueList items={queueItems} copy={copy} />
        </div>
      </section>
    </main>
  )
}
