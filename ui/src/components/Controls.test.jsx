import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { getTranslation } from '../i18n/translations'
import Controls from './Controls'

const copy = getTranslation('en')


// Verify that duration stays editable in the simplified chunk-only flow.
test('keeps the duration input enabled', () => {
  render(
    <Controls
      settings={{ mode: 'chunk', crop: 'none', duration: 30 }}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onDurationChange={() => {}}
      onSubmit={() => {}}
      copy={copy}
    />,
  )

  expect(screen.getByLabelText(/duration/i)).toBeEnabled()
})


// Verify that the simplified settings panel keeps chunk helper copy visible.
test('shows the chunk duration helper copy', () => {
  render(
    <Controls
      settings={{ mode: 'chunk', crop: 'none', duration: 30 }}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onDurationChange={() => {}}
      onSubmit={() => {}}
      copy={copy}
    />,
  )

  expect(screen.getByText(copy.durationInfoChunk)).toBeInTheDocument()
})


// Verify that crop helper copy explains centered framing.
test('shows centered crop helper copy', () => {
  render(
    <Controls
      settings={{ mode: 'chunk', crop: 'vertical', duration: 30 }}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onDurationChange={() => {}}
      onSubmit={() => {}}
      copy={copy}
    />,
  )

  expect(screen.getByText(copy.cropInfo)).toBeInTheDocument()
  expect(screen.queryByLabelText(/smart face crop/i)).not.toBeInTheDocument()
})


// Verify that the start button forwards click events.
test('calls onSubmit when the start button is clicked', () => {
  const onSubmit = vi.fn()

  render(
    <Controls
      settings={{ mode: 'chunk', crop: 'none', duration: 30 }}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onDurationChange={() => {}}
      onSubmit={onSubmit}
      copy={copy}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: /start processing/i }))

  expect(onSubmit).toHaveBeenCalledTimes(1)
})
