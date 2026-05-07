import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import ProgressBar from './ProgressBar'


// Verify that active jobs expose the current progress value and status classes.
test('renders a processing progress bar with the expected width and classes', () => {
  const { container } = render(<ProgressBar value={48} status="processing" />)

  const progressBar = screen.getByRole('progressbar', { name: /progress bar/i })
  const progressValue = container.querySelector('.progress-value-processing')

  expect(progressBar).toHaveClass('progress-track', 'progress-track-processing')
  expect(progressBar).toHaveAttribute('aria-valuenow', '48')
  expect(progressValue).toHaveStyle({ width: '48%' })
})


// Verify that completed jobs clamp out-of-range values and switch to success styling.
test('clamps invalid progress values and uses success styling', () => {
  const { container } = render(<ProgressBar value={140} status="success" />)

  const progressBar = screen.getByRole('progressbar', { name: /progress bar/i })
  const progressValue = container.querySelector('.progress-value-success')

  expect(progressBar).toHaveClass('progress-track', 'progress-track-success')
  expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  expect(progressValue).toHaveStyle({ width: '100%' })
})
