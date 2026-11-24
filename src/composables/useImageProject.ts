import { markRaw, onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue'
import type { DeviceProfile, AnimationFrame, ImageSettings } from '@/types/studio'
import {
  defaultImageSettings,
  processImage,
  type ProcessedImage,
} from '@/modules/image/imageProcessing'

export interface StudioFrame extends AnimationFrame {
  source: HTMLImageElement
  processed: ProcessedImage
}

interface ImageSource {
  file: File
  url: string
  image: HTMLImageElement
}

function isSupportedImage(file: File): boolean {
  return (
    /^(image\/(png|jpeg|bmp|webp))$/i.test(file.type) || /\.(png|jpe?g|bmp|webp)$/i.test(file.name)
  )
}

function loadImage(file: File): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ file, url, image: markRaw(image) })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Unable to open image: ${file.name}`))
    }
    image.src = url
  })
}

export function useImageProject(device: Ref<DeviceProfile>) {
  const imageSettings = ref<ImageSettings>({ ...defaultImageSettings })
  const staticSource = shallowRef<ImageSource | null>(null)
  const processedStatic = shallowRef<ProcessedImage | null>(null)
  const frames = shallowRef<StudioFrame[]>([])
  const isProcessing = ref(false)
  const error = ref('')

  function reprocess() {
    try {
      processedStatic.value = staticSource.value
        ? processImage(staticSource.value.image, device.value, imageSettings.value)
        : null
      frames.value = frames.value.map((frame) => ({
        ...frame,
        processed: processImage(frame.source, device.value, imageSettings.value),
      }))
      error.value = ''
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Image processing failed'
    }
  }

  watch(device, reprocess, { flush: 'sync' })

  async function uploadStatic(files: FileList | File[]) {
    if (isProcessing.value) return
    error.value = ''
    const file = Array.from(files).find(isSupportedImage)
    if (!file) {
      error.value = 'Unsupported file type. Choose a PNG, JPG, BMP or WebP image.'
      return
    }

    isProcessing.value = true
    try {
      const source = await loadImage(file)
      if (staticSource.value) URL.revokeObjectURL(staticSource.value.url)
      staticSource.value = source
      reprocess()
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Unable to load image'
    } finally {
      isProcessing.value = false
    }
  }

  function clearStaticImage() {
    if (staticSource.value) URL.revokeObjectURL(staticSource.value.url)
    staticSource.value = null
    processedStatic.value = null
    error.value = ''
  }

  async function uploadFrames(files: FileList | File[]) {
    if (isProcessing.value) return
    error.value = ''
    const selected = Array.from(files)
    const accepted = selected.filter(isSupportedImage)
    if (!accepted.length) {
      error.value = 'Unsupported file type. Choose PNG, JPG, BMP or WebP images.'
      return
    }

    isProcessing.value = true
    try {
      const results = await Promise.allSettled(accepted.map(loadImage))
      const sources = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      const failedCount = results.length - sources.length
      if (!sources.length) {
        const failure = results.find((result) => result.status === 'rejected')
        throw failure?.status === 'rejected' && failure.reason instanceof Error
          ? failure.reason
          : new Error('Unable to load any of the selected animation frames')
      }

      let added: StudioFrame[]
      try {
        added = sources.map((source) => ({
          id: crypto.randomUUID(),
          file: source.file,
          url: source.url,
          source: source.image,
          duration: 120,
          processed: processImage(source.image, device.value, imageSettings.value),
        }))
      } catch (reason) {
        for (const source of sources) URL.revokeObjectURL(source.url)
        throw reason
      }
      frames.value = [...frames.value, ...added]
      const skippedCount = selected.length - accepted.length + failedCount
      if (skippedCount) {
        error.value = `${skippedCount} unsupported or unreadable file${skippedCount === 1 ? '' : 's'} skipped.`
      }
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Unable to load animation frames'
    } finally {
      isProcessing.value = false
    }
  }

  function updateSettings(patch: Partial<ImageSettings>) {
    imageSettings.value = { ...imageSettings.value, ...patch }
    reprocess()
  }

  onBeforeUnmount(() => {
    if (staticSource.value) URL.revokeObjectURL(staticSource.value.url)
    for (const frame of frames.value) URL.revokeObjectURL(frame.url)
  })

  return {
    imageSettings,
    staticSource,
    processedStatic,
    frames,
    isProcessing,
    error,
    uploadStatic,
    clearStaticImage,
    uploadFrames,
    updateSettings,
    reprocess,
  }
}
