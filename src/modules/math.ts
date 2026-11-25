/** Image scaling, positioning, grayscale, and bitmap conversion formulas. */
export function calculateCoverScale(
  deviceWidth: number,
  deviceHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): number {
  return Math.max(deviceWidth / sourceWidth, deviceHeight / sourceHeight)
}

export function calculateScaledSize(sourceSize: number, scale: number, userScale = 1): number {
  return sourceSize * scale * userScale
}

export function calculateCropOffset(deviceSize: number, imageSize: number, crop: number): number {
  return (deviceSize - imageSize) * (0.5 + crop / 200)
}

export function calculateCenteredOffset(containerSize: number, contentSize: number): number {
  return (containerSize - contentSize) / 2
}

export function calculateThumbnailScale(
  sourceWidth: number,
  sourceHeight: number,
  size: number,
): number {
  return Math.min(size / sourceWidth, size / sourceHeight)
}

/** Standard weighted RGB-to-luminance formula. */
export function calculateLuminance(red: number, green: number, blue: number): number {
  return red * 0.299 + green * 0.587 + blue * 0.114
}

/** Contrast factor used by the image adjustment controls. */
export function calculateContrastFactor(contrast: number): number {
  return (259 * (contrast + 255)) / (255 * (259 - contrast))
}

export function adjustBrightnessAndContrast(
  luminance: number,
  contrastFactor: number,
  brightness: number,
): number {
  return Math.max(0, Math.min(255, contrastFactor * (luminance - 128) + 128 + brightness))
}

/** Encodes black as 1 and white as 0 in the exported bitmap buffer. */
export function thresholdToBitmapPixel(value: number, threshold: number): 0 | 1 {
  return value < threshold ? 1 : 0
}

export function thresholdToMonochrome(value: number, threshold: number): 0 | 255 {
  return value < threshold ? 0 : 255
}

/** Floyd–Steinberg diffusion amount for a given neighbor weight. */
export function calculateDiffusedError(error: number, weight: number): number {
  return (error * weight) / 16
}

export function calculatePixelIndex(x: number, y: number, width: number): number {
  return y * width + x
}

export function bitmapPixelToColor(pixel: number): number {
  return pixel === 1 ? 0 : 255
}

/** Enforces the existing minimum delay and fallback for GIF frames. */
export function normalizeGifFrameDuration(delay: number): number {
  return Math.max(20, delay || 100)
}

export function calculateHalfWidth(width: number): number {
  return Math.floor(width / 2)
}
