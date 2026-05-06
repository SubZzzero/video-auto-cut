import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { getTranslation } from '../i18n/translations'
import Controls from './Controls'

const copy = getTranslation('en')
const activeItem = {
  id: 'item-1',
  file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
  crop: 'none',
  duration: 30,
  startTime: 120,
  endTime: 180,
  durationSeconds: 600,
  metadataError: '',
}


// Verify that duration stays editable in the selected-range flow.
test('keeps the duration input enabled', () => {
  render(
    <Controls
      activeItem={activeItem}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onCropPositionChange={() => {}}
      onDurationChange={() => {}}
      onStartTimeChange={() => {}}
      onEndTimeChange={() => {}}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onVideoMetadataChange={() => {}}
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
      activeItem={activeItem}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onCropPositionChange={() => {}}
      onDurationChange={() => {}}
      onStartTimeChange={() => {}}
      onEndTimeChange={() => {}}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onVideoMetadataChange={() => {}}
      onSubmit={() => {}}
      copy={copy}
    />,
  )

  expect(screen.getByText(copy.durationInfoChunk)).toBeInTheDocument()
})


// Verify that crop helper copy and range details stay visible.
test('shows crop helper copy and selected range details', () => {
  render(
    <Controls
      activeItem={{ ...activeItem, crop: 'vertical' }}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onCropPositionChange={() => {}}
      onDurationChange={() => {}}
      onStartTimeChange={() => {}}
      onEndTimeChange={() => {}}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onVideoMetadataChange={() => {}}
      onSubmit={() => {}}
      copy={copy}
    />,
  )

  expect(screen.getByText(copy.cropInfo)).toBeInTheDocument()
  expect(screen.getByText(copy.rangeEditorTitle)).toBeInTheDocument()
  expect(screen.getByDisplayValue('00:02:00')).toBeInTheDocument()
  expect(screen.getByDisplayValue('00:03:00')).toBeInTheDocument()
})


// Verify that the start button forwards click events.
test('calls onSubmit when the start button is clicked', () => {
  const onSubmit = vi.fn()

  render(
    <Controls
      activeItem={activeItem}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onCropPositionChange={() => {}}
      onDurationChange={() => {}}
      onStartTimeChange={() => {}}
      onEndTimeChange={() => {}}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onVideoMetadataChange={() => {}}
      onSubmit={onSubmit}
      copy={copy}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: /start processing/i }))

  expect(onSubmit).toHaveBeenCalledTimes(1)
})


// Verify that the range editor handlers receive input changes.
test('forwards start and end time input changes', () => {
  const onStartTimeChange = vi.fn()
  const onEndTimeChange = vi.fn()

  render(
    <Controls
      activeItem={activeItem}
      disabled={false}
      canSubmit
      onCropChange={() => {}}
      onCropPositionChange={() => {}}
      onDurationChange={() => {}}
      onStartTimeChange={onStartTimeChange}
      onEndTimeChange={onEndTimeChange}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onVideoMetadataChange={() => {}}
      onSubmit={() => {}}
      copy={copy}
    />,
  )

  fireEvent.change(screen.getByLabelText(copy.startTimeLabel), { target: { value: '000215' } })
  fireEvent.change(screen.getByLabelText(copy.endTimeLabel), { target: { value: '000315' } })

  expect(onStartTimeChange).toHaveBeenCalledTimes(1)
  expect(onEndTimeChange).toHaveBeenCalledTimes(1)
})
