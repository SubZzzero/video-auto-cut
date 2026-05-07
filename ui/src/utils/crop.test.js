import { expect, test } from 'vitest'

import { snapCropPosition } from './crop'


// Verify that near-center crop positions snap onto the center guides.
test('snaps crop positions to the center guides when they are within threshold', () => {
  expect(snapCropPosition(800, 600, 400, 300, 188, 140)).toEqual({
    cropX: 200,
    cropY: 150,
  })
})


// Verify that positions outside the threshold keep their free-drag placement.
test('keeps crop positions unchanged when they are outside the snap threshold', () => {
  expect(snapCropPosition(800, 600, 400, 300, 179, 129)).toEqual({
    cropX: 179,
    cropY: 129,
  })
})


// Verify that near-edge crop positions snap to the bounded frame edges.
test('snaps crop positions to the nearest frame edges', () => {
  expect(snapCropPosition(800, 600, 400, 300, 389, 289)).toEqual({
    cropX: 400,
    cropY: 300,
  })
})
