import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

import App from './App'

const mocks = vi.hoisted(() => ({
  createProcessJob: vi.fn(),
  getJobStatus: vi.fn(),
  cancelJob: vi.fn(),
  loadVideoMetadata: vi.fn(),
  mockFiles: [],
}))

vi.mock('./api/client', () => ({
  createProcessJob: mocks.createProcessJob,
  getJobStatus: mocks.getJobStatus,
  cancelJob: mocks.cancelJob,
}))

vi.mock('./utils/video', () => ({
  loadVideoMetadata: mocks.loadVideoMetadata,
}))

vi.mock('./components/LanguageSwitcher', () => ({
  default: function MockLanguageSwitcher() {
    return null
  },
}))

vi.mock('./components/FileUpload', () => ({
  // Render one deterministic file picker trigger for queue tests.
  default: function MockFileUpload({ onChange, copy }) {
    return (
      <button type="button" onClick={() => onChange({ target: { files: mocks.mockFiles } })}>
        {copy.selectVideos}
      </button>
    )
  },
}))

vi.mock('./components/Controls', () => ({
  // Render only the actions needed for queue orchestration tests.
  default: function MockControls({ canSubmit, canCancel, isCancelling, onSubmit, onCancel, copy }) {
    return (
      <div>
        {canCancel ? (
          <button type="button" className="action-button-secondary" disabled={isCancelling} onClick={onCancel}>
            {copy.stopProcessing}
          </button>
        ) : (
          <button type="button" disabled={!canSubmit} onClick={onSubmit}>
            {copy.startProcessing}
          </button>
        )}
      </div>
    )
  },
}))

vi.mock('./components/QueueList', () => ({
  // Render one compact queue summary for assertions.
  default: function MockQueueList({ items }) {
    return (
      <ul>
        {items.map((item) => (
          <li key={item.id}>{`${item.file.name}:${item.message}`}</li>
        ))}
      </ul>
    )
  },
}))


// Build one stable metadata payload for mocked local videos.
function buildVideoMetadata() {
  return {
    durationSeconds: 120,
    sourceWidth: 1920,
    sourceHeight: 1080,
  }
}


beforeEach(() => {
  mocks.mockFiles = []
  mocks.createProcessJob.mockReset()
  mocks.getJobStatus.mockReset()
  mocks.cancelJob.mockReset()
  mocks.loadVideoMetadata.mockReset()
})


// Verify that cancelling the active job stops the remaining batch queue.
test('stops the batch after cancelling the active job', async () => {
  let resolveStatusRequest
  mocks.mockFiles = [
    new File(['one'], 'clip-1.mp4', { type: 'video/mp4' }),
    new File(['two'], 'clip-2.mp4', { type: 'video/mp4' }),
  ]
  mocks.loadVideoMetadata.mockResolvedValue(buildVideoMetadata())
  mocks.createProcessJob.mockResolvedValue({
    jobId: 'job-1',
    status: 'queued',
    progress: 0,
    message: 'Job queued.',
  })
  mocks.getJobStatus.mockImplementation(
    () => new Promise((resolve) => {
      resolveStatusRequest = resolve
    }),
  )
  mocks.cancelJob.mockResolvedValue({
    jobId: 'job-1',
    fileName: 'clip-1.mp4',
    crop: 'none',
    cropX: null,
    cropY: null,
    duration: 30,
    startTime: 0,
    endTime: 120,
    status: 'processing',
    progress: 0,
    message: 'Cancelling processing.',
    outputs: [],
    error: null,
  })

  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: /select videos/i }))

  await waitFor(() => expect(screen.getByRole('button', { name: /start processing/i })).toBeEnabled())

  fireEvent.click(screen.getByRole('button', { name: /start processing/i }))

  await waitFor(() => expect(screen.getByRole('button', { name: /^stop$/i })).toBeInTheDocument())

  fireEvent.click(screen.getByRole('button', { name: /^stop$/i }))

  resolveStatusRequest({
    jobId: 'job-1',
    fileName: 'clip-1.mp4',
    crop: 'none',
    cropX: null,
    cropY: null,
    duration: 30,
    startTime: 0,
    endTime: 120,
    status: 'cancelled',
    progress: 0,
    message: 'Processing cancelled.',
    outputs: [],
    error: null,
  })

  await waitFor(() => expect(mocks.cancelJob).toHaveBeenCalledWith('job-1'))
  await waitFor(() => expect(mocks.createProcessJob).toHaveBeenCalledTimes(1))
  expect(mocks.getJobStatus).toHaveBeenCalledTimes(1)
})
