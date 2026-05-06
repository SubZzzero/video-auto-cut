import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { getTranslation } from '../i18n/translations'
import VideoRangeEditor from './VideoRangeEditor'

const copy = getTranslation('en')
const baseItem = {
  id: 'item-1',
  file: new File(['video'], 'clip.mp4', { type: 'video/mp4' }),
  crop: 'none',
  duration: 30,
  startTime: 120,
  endTime: 180,
  durationSeconds: 600,
  sourceWidth: 800,
  sourceHeight: 800,
  cropX: null,
  cropY: null,
  metadataError: '',
}


// Render the editor with stable video layout and metadata.
function renderEditor(itemOverrides = {}, propOverrides = {}) {
  const props = {
    item: { ...baseItem, ...itemOverrides },
    disabled: false,
    onStartTimeChange: () => {},
    onEndTimeChange: () => {},
    onStartSliderChange: () => {},
    onEndSliderChange: () => {},
    onCropPositionChange: () => {},
    onVideoMetadataChange: () => {},
    copy,
    ...propOverrides,
  }

  render(<VideoRangeEditor {...props} />)
  const video = document.querySelector('video')
  Object.defineProperty(video, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width: 400, height: 400, top: 0, left: 0, right: 400, bottom: 400 }),
  })
  Object.defineProperty(video, 'duration', { configurable: true, value: props.item.durationSeconds })
  Object.defineProperty(video, 'videoWidth', { configurable: true, value: props.item.sourceWidth })
  Object.defineProperty(video, 'videoHeight', { configurable: true, value: props.item.sourceHeight })
  fireEvent.loadedMetadata(video)
  return props
}


// Verify that no crop overlay is shown when no preset is selected.
test('hides the crop overlay when no preset is selected', () => {
  renderEditor()

  expect(screen.queryByTestId('crop-overlay')).not.toBeInTheDocument()
})


// Verify that selecting a preset renders a visible crop frame.
test('shows the crop overlay for a selected preset', () => {
  renderEditor({ crop: 'vertical', cropX: 175, cropY: 0 })

  expect(screen.getByTestId('crop-overlay')).toBeInTheDocument()
  expect(screen.getByTestId('crop-frame')).toHaveStyle({ width: '225px', height: '400px' })
})


// Verify that switching presets updates the rendered crop geometry.
test('updates crop frame geometry when the preset changes', () => {
  const { rerender } = render(
    <VideoRangeEditor
      item={{ ...baseItem, crop: 'vertical', cropX: 175, cropY: 0 }}
      disabled={false}
      onStartTimeChange={() => {}}
      onEndTimeChange={() => {}}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onCropPositionChange={() => {}}
      onVideoMetadataChange={() => {}}
      copy={copy}
    />,
  )

  const video = document.querySelector('video')
  Object.defineProperty(video, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width: 400, height: 400, top: 0, left: 0, right: 400, bottom: 400 }),
  })
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 })
  Object.defineProperty(video, 'videoWidth', { configurable: true, value: 800 })
  Object.defineProperty(video, 'videoHeight', { configurable: true, value: 800 })
  fireEvent.loadedMetadata(video)

  expect(screen.getByTestId('crop-frame')).toHaveStyle({ width: '225px', height: '400px' })

  rerender(
    <VideoRangeEditor
      item={{ ...baseItem, crop: 'square_1_1', cropX: 0, cropY: 0 }}
      disabled={false}
      onStartTimeChange={() => {}}
      onEndTimeChange={() => {}}
      onStartSliderChange={() => {}}
      onEndSliderChange={() => {}}
      onCropPositionChange={() => {}}
      onVideoMetadataChange={() => {}}
      copy={copy}
    />,
  )
  fireEvent.loadedMetadata(video)

  expect(screen.getByTestId('crop-frame')).toHaveStyle({ width: '400px', height: '400px' })
})


// Verify that drag updates stay clamped inside the preview bounds.
test('clamps drag movement inside the video bounds', () => {
  const onCropPositionChange = vi.fn()
  renderEditor({ crop: 'vertical', cropX: 175, cropY: 0 }, { onCropPositionChange })

  fireEvent.pointerDown(screen.getByTestId('crop-frame'), { clientX: 100, clientY: 80 })
  fireEvent.pointerMove(window, { clientX: 220, clientY: 180 })
  fireEvent.pointerUp(window)

  expect(onCropPositionChange).toHaveBeenCalled()
  expect(onCropPositionChange).toHaveBeenLastCalledWith({ cropX: 350, cropY: 0 })
})


// Verify that loaded metadata is forwarded to the parent state layer.
test('forwards loaded video metadata to the parent', () => {
  const onVideoMetadataChange = vi.fn()
  renderEditor({}, { onVideoMetadataChange })

  expect(onVideoMetadataChange).toHaveBeenCalledWith({
    durationSeconds: 600,
    sourceWidth: 800,
    sourceHeight: 800,
  })
})
