import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { getTranslation } from '../i18n/translations'
import StatusPanel from './StatusPanel'

const copy = getTranslation('en')


// Verify that the panel shows an idle message with an empty queue.
test('shows the idle guidance for an empty queue', () => {
  render(<StatusPanel state="idle" queueItems={[]} copy={copy} />)

  expect(screen.getByText(/upload files to create a processing queue/i)).toBeInTheDocument()
})


// Verify that the panel shows compact metric chips for queue progress.
test('shows compact queue metrics when items exist', () => {
  render(
    <StatusPanel
      state="error"
      queueItems={[
        { status: 'success' },
        { status: 'error' },
        { status: 'queued' },
      ]}
      copy={copy}
    />,
  )

  expect(screen.getAllByText('1')).toHaveLength(3)
  expect(screen.getByText(copy.statusMetrics.completed)).toBeInTheDocument()
  expect(screen.getByText(copy.statusMetrics.failed)).toBeInTheDocument()
  expect(screen.getByText(copy.statusMetrics.remaining)).toBeInTheDocument()
  expect(screen.queryByText(/upload files to create a processing queue/i)).not.toBeInTheDocument()
})
