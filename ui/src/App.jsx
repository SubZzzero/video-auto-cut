import { useState } from 'react'

import { createProcessJob, getJobStatus } from './api/client'
import './App.css'
import Controls from './components/Controls'
import FileUpload from './components/FileUpload'
import LanguageSwitcher from './components/LanguageSwitcher'
import QueueList from './components/QueueList'
import { DEFAULT_FORM_SETTINGS, DEFAULT_LANGUAGE, QUEUE_STATUS, STATUS_POLL_INTERVAL_MS } from './config/constants'
import { getTranslation } from './i18n/translations'
import { getErrorMessage } from './utils/errors'
import { createQueueItems, sleep } from './utils/queue'

// Normalize a number input into a valid chunk duration.
function parseDuration(value) {
  const parsedValue = Number(value)
  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return 1
  }

  return parsedValue
}

// Create the root application component.
export default function App() {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [settings, setSettings] = useState(DEFAULT_FORM_SETTINGS)
  const [queueItems, setQueueItems] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const copy = getTranslation(language)

  // Replace the queue when a new set of files is selected.
  function handleFileChange(event) {
    const nextFiles = Array.from(event.target.files ?? [])
    setSelectedFiles(nextFiles)
    setQueueItems(createQueueItems(nextFiles))
  }

  // Update the selected UI language.
  function handleLanguageChange(event) {
    setLanguage(event.target.value)
  }

  // Update the selected crop mode.
  function handleCropChange(event) {
    setSettings((current) => ({ ...current, crop: event.target.value }))
  }

  // Update the requested chunk duration.
  function handleDurationChange(event) {
    setSettings((current) => ({ ...current, duration: parseDuration(event.target.value) }))
  }

  // Patch one queue item by id.
  function updateQueueItem(itemId, patch) {
    setQueueItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)))
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
    setIsRunning(true)

    try {
      for (const item of queueItems) {
        updateQueueItem(item.id, {
          status: QUEUE_STATUS.uploading,
          progress: 5,
          message: 'Uploading file.',
          error: '',
        })

        try {
          const createdJob = await createProcessJob(item.file, settings)
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
          <FileUpload files={selectedFiles} disabled={isRunning} onChange={handleFileChange} copy={copy} />
          <Controls
            settings={settings}
            disabled={isRunning}
            canSubmit={queueItems.length > 0}
            onCropChange={handleCropChange}
            onDurationChange={handleDurationChange}
            onSubmit={handleStartProcessing}
            copy={copy}
          />
          <QueueList items={queueItems} copy={copy} />
        </div>
      </section>
    </main>
  )
}
