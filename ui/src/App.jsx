import { useMemo, useState } from 'react'

import { createProcessJob, getJobStatus } from './api/client'
import './App.css'
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
import { getErrorMessage } from './utils/errors'
import { createQueueItems, sleep } from './utils/queue'
import {
  parseClockInput,
  resolveEndTime,
  resolveStartTime,
} from './utils/time'
import { loadVideoDuration } from './utils/video'

// Normalize a number input into a valid chunk duration.
function parseDuration(value) {
  const parsedValue = Number(value)
  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return 1
  }

  return parsedValue
}


// Build one default settings object for a file with known duration.
function buildDefaultItemSettings(durationSeconds) {
  return {
    crop: DEFAULT_FORM_SETTINGS.crop,
    duration: DEFAULT_FORM_SETTINGS.duration,
    startTime: 0,
    endTime: durationSeconds,
    durationSeconds,
    metadataError: '',
  }
}


// Load per-file queue settings from local video metadata.
async function buildQueueItemsWithMetadata(files) {
  const settingsList = await Promise.all(
    files.map(async (file) => {
      try {
        const durationSeconds = await loadVideoDuration(file)
        return buildDefaultItemSettings(durationSeconds)
      } catch (error) {
        return {
          ...buildDefaultItemSettings(MIN_RANGE_DURATION_SECONDS),
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

  const copy = getTranslation(language)
  const activeItem = useMemo(
    () => queueItems.find((item) => item.id === activeItemId) ?? queueItems[0] ?? null,
    [activeItemId, queueItems],
  )
  const canSubmit = queueItems.length > 0 && queueItems.every(isQueueItemReady)

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

  // Update the active queue item crop mode.
  function handleCropChange(event) {
    if (!activeItem) {
      return
    }

    updateQueueItem(activeItem.id, { crop: event.target.value })
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
        status: status.status,
        progress: status.progress,
        message: status.message,
        outputs: status.outputs,
        error: status.error ?? '',
        jobId,
      })

      if (status.status === QUEUE_STATUS.success || status.status === QUEUE_STATUS.error) {
        return status
      }

      await sleep(STATUS_POLL_INTERVAL_MS)
    }
  }

  // Process the current queue from top to bottom.
  async function handleStartProcessing() {
    const itemsToProcess = queueItems.map((item) => ({ ...item }))
    setIsRunning(true)

    try {
      for (const item of itemsToProcess) {
        updateQueueItem(item.id, {
          status: QUEUE_STATUS.uploading,
          progress: 5,
          message: 'Uploading file.',
          error: '',
        })

        try {
          const createdJob = await createProcessJob(item.file, item)
          updateQueueItem(item.id, {
            status: createdJob.status,
            progress: createdJob.progress,
            message: createdJob.message,
            jobId: createdJob.jobId,
          })
          await waitForCompletion(item.id, createdJob.jobId)
        } catch (error) {
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
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header stack">
        <div className="header-row">
          <div>
            <h1>{copy.appTitle}</h1>
            <p>{copy.appDescription}</p>
          </div>
          <LanguageSwitcher language={language} onChange={handleLanguageChange} copy={copy} />
        </div>
      </header>
      <section className="app-grid">
        <div className="stack">
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
            onCropChange={handleCropChange}
            onDurationChange={handleDurationChange}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            onStartSliderChange={handleStartSliderChange}
            onEndSliderChange={handleEndSliderChange}
            onSubmit={handleStartProcessing}
            copy={copy}
          />
          <QueueList items={queueItems} copy={copy} />
        </div>
      </section>
    </main>
  )
}
