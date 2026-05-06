import { CROP_PRESET_RATIOS } from '../config/constants'


// Keep crop dimensions aligned with ffmpeg-friendly even pixel sizes.
function toEvenDimension(value) {
  return Math.max(2, value - (value % 2))
}


// Return whether one crop preset should show an overlay.
export function isPresetSelected(cropMode) {
  return cropMode !== 'none'
}


// Resolve one numeric aspect ratio from the selected crop preset.
export function getCropAspectRatio(cropMode) {
  const preset = CROP_PRESET_RATIOS[cropMode]
  if (!preset) {
    return null
  }

  return preset.width / preset.height
}


// Calculate the crop frame size that fits inside one source video.
export function calculateCropSize(sourceWidth, sourceHeight, cropMode) {
  const aspectRatio = getCropAspectRatio(cropMode)
  if (!aspectRatio || sourceWidth <= 0 || sourceHeight <= 0) {
    return null
  }

  const sourceRatio = sourceWidth / sourceHeight
  if (sourceRatio > aspectRatio) {
    return {
      width: toEvenDimension(Math.round(sourceHeight * aspectRatio)),
      height: toEvenDimension(sourceHeight),
    }
  }

  return {
    width: toEvenDimension(sourceWidth),
    height: toEvenDimension(Math.round(sourceWidth / aspectRatio)),
  }
}


// Clamp one crop origin so the full frame remains inside source bounds.
export function clampCropPosition(sourceWidth, sourceHeight, cropWidth, cropHeight, cropX, cropY) {
  return {
    cropX: Math.max(0, Math.min(cropX, sourceWidth - cropWidth)),
    cropY: Math.max(0, Math.min(cropY, sourceHeight - cropHeight)),
  }
}


// Resolve one complete crop placement from source geometry and a preset.
export function resolveCropPlacement(sourceWidth, sourceHeight, cropMode, cropX = null, cropY = null) {
  const size = calculateCropSize(sourceWidth, sourceHeight, cropMode)
  if (!size) {
    return null
  }

  const centeredX = Math.round((sourceWidth - size.width) / 2)
  const centeredY = Math.round((sourceHeight - size.height) / 2)
  const requestedX = cropX ?? centeredX
  const requestedY = cropY ?? centeredY
  const safePosition = clampCropPosition(sourceWidth, sourceHeight, size.width, size.height, requestedX, requestedY)

  return {
    cropX: safePosition.cropX,
    cropY: safePosition.cropY,
    cropWidth: size.width,
    cropHeight: size.height,
    aspectRatio: size.width / size.height,
  }
}


// Preserve one crop center while switching to another preset when possible.
export function resolveCropPositionForPreset(sourceWidth, sourceHeight, previousCropMode, nextCropMode, cropX, cropY) {
  const nextPlacement = resolveCropPlacement(sourceWidth, sourceHeight, nextCropMode)
  if (!nextPlacement) {
    return { cropX: null, cropY: null }
  }

  const currentPlacement = resolveCropPlacement(sourceWidth, sourceHeight, previousCropMode, cropX, cropY)
  if (!currentPlacement) {
    return { cropX: nextPlacement.cropX, cropY: nextPlacement.cropY }
  }

  const centerX = currentPlacement.cropX + (currentPlacement.cropWidth / 2)
  const centerY = currentPlacement.cropY + (currentPlacement.cropHeight / 2)
  const nextRequestedX = Math.round(centerX - (nextPlacement.cropWidth / 2))
  const nextRequestedY = Math.round(centerY - (nextPlacement.cropHeight / 2))
  const safePlacement = resolveCropPlacement(sourceWidth, sourceHeight, nextCropMode, nextRequestedX, nextRequestedY)

  return {
    cropX: safePlacement?.cropX ?? nextPlacement.cropX,
    cropY: safePlacement?.cropY ?? nextPlacement.cropY,
  }
}
