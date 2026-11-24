import { markRaw, onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue'
import type { DeviceProfile, AnimationFrame, ImageSettings } from '@/types/studio'
import {
  defaultImageSettings,
  processImage,
  type ImageRasterSource,
  type ProcessedImage,
} from '@/modules/image/imageProcessing'
import { importGifFrames, isGifFile } from '@/modules/image/gifImport'

export interface StudioFrame extends AnimationFrame {
  source: ImageRasterSource
  processed: ProcessedImage
}

interface ImageSource {
  file: File
  url: string
  image: HTMLImageElement
}

export interface UploadProgress {
  completed: number
  total: number
  message: string
}

function isSupportedImage(file: File): boolean {
  return (
    /^(image\/(png|jpeg|bmp|webp|gif))$/i.test(file.type) ||
    /\.(png|jpe?g|bmp|webp|gif)$/i.test(file.name)
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

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

export function useImageProject(device: Ref<DeviceProfile>) {
  const imageSettings = ref<ImageSettings>({ ...defaultImageSettings })
  const staticSource = shallowRef<ImageSource | null>(null)
  const processedStatic = shallowRef<ProcessedImage | null>(null)
  const frames = shallowRef<StudioFrame[]>([])
  const isProcessing = ref(false)
  const uploadProgress = shallowRef<UploadProgress | null>(null)
  const error = ref('')

  let reprocessRevision = 0

  async function reprocess() {
    const revision = ++reprocessRevision
    const profile = device.value
    const settings = { ...imageSettings.value }
    const sourceFrames = frames.value.slice()
    try {
      const staticResult = staticSource.value
        ? processImage(staticSource.value.image, profile, settings)
        : null
      if (revision !== reprocessRevision) return
      processedStatic.value = staticResult

      const processedFrames = new Map<string, ProcessedImage>()
      for (let index = 0; index < sourceFrames.length; index++) {
        if (revision !== reprocessRevision) return
        const frame = sourceFrames[index]!
        processedFrames.set(frame.id, processImage(frame.source, profile, settings))
        if (index % 2 === 1) await yieldToBrowser()
      }

      if (revision !== reprocessRevision) return
      frames.value = frames.value.map((frame) => {
        const processed = processedFrames.get(frame.id)
        return processed ? { ...frame, processed } : frame
      })
      error.value = ''
    } catch (reason) {
      if (revision !== reprocessRevision) return
      error.value = reason instanceof Error ? reason.message : 'Image processing failed'
    }
  }

  watch(device, () => void reprocess(), { flush: 'sync' })

  async function uploadStatic(files: FileList | File[]) {
    if (isProcessing.value) return
    error.value = ''
    const file = Array.from(files).find(
      (candidate) => isSupportedImage(candidate) && !isGifFile(candidate),
    )
    if (!file) {
      error.value = 'Choose a PNG, JPG, BMP or WebP image. Import GIFs from the Animation tab.'
      return
    }

    isProcessing.value = true
    uploadProgress.value = { completed: 0, total: 1, message: 'Loading image' }
    let pendingSource: ImageSource | null = null
    try {
      const source = await loadImage(file)
      pendingSource = source
      uploadProgress.value = { completed: 0, total: 1, message: 'Processing image' }
      await yieldToBrowser()
      const processed = processImage(source.image, device.value, imageSettings.value)
      if (staticSource.value) URL.revokeObjectURL(staticSource.value.url)
      staticSource.value = source
      pendingSource = null
      processedStatic.value = processed
      error.value = ''
      uploadProgress.value = { completed: 1, total: 1, message: 'Image ready' }
    } catch (reason) {
      if (pendingSource) URL.revokeObjectURL(pendingSource.url)
      error.value = reason instanceof Error ? reason.message : 'Unable to load image'
    } finally {
      isProcessing.value = false
      uploadProgress.value = null
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
      error.value = 'Unsupported file type. Choose PNG, JPG, BMP, WebP or GIF images.'
      return
    }

    isProcessing.value = true
    uploadProgress.value = {
      completed: selected.length - accepted.length,
      total: selected.length,
      message: 'Loading and processing frames',
    }
    const ownedUrls = new Set<string>()
    const committedUrls = new Set<string>()
    try {
      let pending: StudioFrame[] = []
      let failedCount = 0
      let addedCount = 0
      let failureMessage = ''

      const commitPending = () => {
        if (!pending.length) return
        frames.value = [...frames.value, ...pending]
        for (const frame of pending) committedUrls.add(frame.url)
        pending = []
      }

      for (let index = 0; index < accepted.length; index++) {
        const file = accepted[index]!
        try {
          if (isGifFile(file)) {
            await importGifFrames(
              file,
              device.value,
              imageSettings.value,
              (gifFrame) => {
                ownedUrls.add(gifFrame.thumbnailUrl)
                pending.push({
                  id: crypto.randomUUID(),
                  file,
                  url: gifFrame.thumbnailUrl,
                  source: gifFrame.source,
                  duration: gifFrame.duration,
                  processed: gifFrame.processed,
                })
                addedCount++
                if (pending.length >= 6) commitPending()
              },
              (completed, total) => {
                uploadProgress.value = {
                  completed,
                  total,
                  message: `Decoding GIF: ${file.name}`,
                }
              },
            )
          } else {
            const source = await loadImage(file)
            ownedUrls.add(source.url)
            pending.push({
              id: crypto.randomUUID(),
              file: source.file,
              url: source.url,
              source: source.image,
              duration: 120,
              processed: processImage(source.image, device.value, imageSettings.value),
            })
            addedCount++
          }
        } catch (reason) {
          failedCount++
          failureMessage = reason instanceof Error ? reason.message : 'Unable to process an image'
        }

        if (!isGifFile(file)) {
          uploadProgress.value = {
            completed: selected.length - accepted.length + index + 1,
            total: selected.length,
            message: 'Loading and processing frames',
          }
        }

        if (pending.length >= 6 || index === accepted.length - 1) commitPending()
        await yieldToBrowser()
      }

      if (!addedCount) {
        throw new Error('Unable to load any of the selected animation frames')
      }

      for (const url of ownedUrls) {
        if (!committedUrls.has(url)) URL.revokeObjectURL(url)
      }

      const skippedCount = selected.length - accepted.length + failedCount
      if (skippedCount) {
        error.value = failureMessage
          ? `${skippedCount} file${skippedCount === 1 ? '' : 's'} skipped. ${failureMessage}`
          : `${skippedCount} unsupported or unreadable file${skippedCount === 1 ? '' : 's'} skipped.`
      }
    } catch (reason) {
      for (const url of ownedUrls) {
        if (!committedUrls.has(url)) URL.revokeObjectURL(url)
      }
      error.value = reason instanceof Error ? reason.message : 'Unable to load animation frames'
    } finally {
      isProcessing.value = false
      uploadProgress.value = null
    }
  }

  function updateSettings(patch: Partial<ImageSettings>) {
    imageSettings.value = { ...imageSettings.value, ...patch }
    void reprocess()
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
    uploadProgress,
    error,
    uploadStatic,
    clearStaticImage,
    uploadFrames,
    updateSettings,
    reprocess,
  }
}
