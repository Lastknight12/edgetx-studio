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

export interface UploadProgress {
  completed: number
  total: number
  message: string
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
      error.value = 'Unsupported file type. Choose PNG, JPG, BMP or WebP images.'
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

      for (let index = 0; index < accepted.length; index++) {
        const file = accepted[index]!
        let loadedUrl: string | null = null
        try {
          const source = await loadImage(file)
          loadedUrl = source.url
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
        } catch {
          failedCount++
          if (loadedUrl) {
            URL.revokeObjectURL(loadedUrl)
            ownedUrls.delete(loadedUrl)
          }
        }

        uploadProgress.value = {
          completed: selected.length - accepted.length + index + 1,
          total: selected.length,
          message: 'Loading and processing frames',
        }

        if (pending.length >= 6 || index === accepted.length - 1) {
          if (pending.length) {
            frames.value = [...frames.value, ...pending]
            for (const frame of pending) committedUrls.add(frame.url)
            pending = []
          }
        }
        await yieldToBrowser()
      }

      if (!addedCount) {
        throw new Error('Unable to load any of the selected animation frames')
      }

      const skippedCount = selected.length - accepted.length + failedCount
      if (skippedCount) {
        error.value = `${skippedCount} unsupported or unreadable file${skippedCount === 1 ? '' : 's'} skipped.`
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
    uploadProgress,
    error,
    uploadStatic,
    clearStaticImage,
    uploadFrames,
    updateSettings,
    reprocess,
  }
}
