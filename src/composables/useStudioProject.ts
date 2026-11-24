import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { renderComposite } from '@/modules/effects/compositing'
import { defaultDevice, deviceProfiles, getDeviceProfile } from '@/modules/devices/deviceRegistry'
import { splitPixels } from '@/modules/image/imageProcessing'
import type { DeviceProfile, ImageSettings } from '@/types/studio'
import type { ExportFrame } from '@/modules/export/exportProject'
import { useAnimationTimeline } from './useAnimationTimeline'
import { useEffectLayers } from './useEffectLayers'
import { useImageProject } from './useImageProject'
import { useProjectExport } from './useProjectExport'

function createBlankCanvas(profile: DeviceProfile): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = profile.width
  canvas.height = profile.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

function canvasFromPixels(pixels: Uint8Array, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')
  const image = context.createImageData(width, height)
  for (let index = 0; index < pixels.length; index++) {
    const color = pixels[index] ? 0 : 255
    const offset = index * 4
    image.data[offset] = color
    image.data[offset + 1] = color
    image.data[offset + 2] = color
    image.data[offset + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return canvas
}

export function useStudioProject() {
  const activeTab = ref('image')
  const deviceId = ref(defaultDevice.id)
  const device = computed<DeviceProfile>(() => getDeviceProfile(deviceId.value))
  const imageProject = useImageProject(device)
  const timeline = useAnimationTimeline(imageProject.frames)
  const layers = useEffectLayers()
  const projectExport = useProjectExport()
  const previewImage = shallowRef(createBlankCanvas(defaultDevice))
  const previewVersion = ref(0)
  const overlayPreviewCanvas = createBlankCanvas(defaultDevice)

  const currentProcessed = computed(
    () => timeline.selectedFrame.value?.processed ?? imageProject.processedStatic.value,
  )
  const imageEditorProcessed = computed(
    () => imageProject.processedStatic.value ?? currentProcessed.value,
  )
  const originalUrl = computed(() => imageProject.staticSource.value?.url ?? null)
  const hasStaticImage = computed(() => imageProject.staticSource.value !== null)
  const processedUrl = computed(
    () => imageEditorProcessed.value?.canvas.toDataURL('image/png') ?? null,
  )
  const sectionPreviews = computed<[string, string] | null>(() => {
    const processed = imageEditorProcessed.value
    if (!processed) return null
    const [left, right] = splitPixels(processed.pixels, device.value)
    const halfWidth = Math.floor(device.value.width / 2)
    return [
      canvasFromPixels(left, halfWidth, device.value.height).toDataURL(),
      canvasFromPixels(right, device.value.width - halfWidth, device.value.height).toDataURL(),
    ]
  })
  const frameSummaries = computed(() =>
    imageProject.frames.value.map(({ id, file, url, duration }) => ({
      id,
      name: file.name,
      url,
      duration,
    })),
  )
  const exportFiles = computed(() => projectExport.result.value?.files ?? [])
  const exportWarnings = computed(() => projectExport.result.value?.warnings ?? [])
  const exportFrameCount = computed(() => Math.max(imageProject.frames.value.length, 1))

  function composeAnimationFrame(
    frame: (typeof imageProject.frames.value)[number],
    output?: HTMLCanvasElement,
  ): HTMLCanvasElement {
    const background = imageProject.processedStatic.value?.canvas
    if (!background || !timeline.overlayAnimation.value) return frame.processed.canvas
    const canvas = output ?? document.createElement('canvas')
    if (canvas.width !== device.value.width) canvas.width = device.value.width
    if (canvas.height !== device.value.height) canvas.height = device.value.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context is unavailable')
    context.globalCompositeOperation = 'source-over'
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(background, 0, 0)
    context.globalCompositeOperation = 'multiply'
    context.drawImage(frame.processed.canvas, 0, 0)
    context.globalCompositeOperation = 'source-over'
    return canvas
  }

  function refreshPreview(time = performance.now() / 1000) {
    try {
      const frame = timeline.selectedFrame.value
      const base = frame
        ? composeAnimationFrame(frame, overlayPreviewCanvas)
        : (imageProject.processedStatic.value?.canvas ?? null)
      renderComposite(base, layers.effects.value, device.value, time, previewImage.value)
      previewVersion.value += 1
    } catch (reason) {
      imageProject.error.value =
        reason instanceof Error ? reason.message : 'Unable to render preview'
    }
  }

  watch(
    [
      imageProject.frames,
      imageProject.processedStatic,
      layers.effects,
      device,
      timeline.overlayAnimation,
    ],
    () => refreshPreview(),
    { immediate: true, flush: 'post' },
  )

  let animationFrame = 0
  let lastPreviewTime = 0
  const previewInterval = 1000 / 30

  function hasAnimatedPreview() {
    return timeline.isPlaying.value || layers.enabledCount.value > 0
  }

  function animatePreview(now: number) {
    animationFrame = 0
    if (!hasAnimatedPreview()) return

    const previousFrameId = timeline.selectedFrameId.value
    if (timeline.isPlaying.value) timeline.advance(now)
    const frameChanged = previousFrameId !== timeline.selectedFrameId.value
    const hasAnimatedEffects = layers.enabledCount.value > 0
    if (hasAnimatedEffects && now - lastPreviewTime >= previewInterval) {
      lastPreviewTime = now
      refreshPreview(now / 1000)
    } else if (frameChanged) {
      lastPreviewTime = now
      refreshPreview(now / 1000)
    }

    if (hasAnimatedPreview()) animationFrame = requestAnimationFrame(animatePreview)
  }

  function syncAnimationLoop() {
    if (hasAnimatedPreview()) {
      if (!animationFrame) animationFrame = requestAnimationFrame(animatePreview)
    } else if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }
  }

  watch([timeline.isPlaying, layers.enabledCount], syncAnimationLoop, { flush: 'sync' })

  function selectFrame(id: string) {
    timeline.selectFrame(id)
    refreshPreview()
  }

  async function uploadStatic(files: FileList | File[]) {
    const previousUrl = imageProject.staticSource.value?.url
    await imageProject.uploadStatic(files)
    if (imageProject.staticSource.value?.url !== previousUrl) projectExport.invalidate()
  }

  function clearStaticImage() {
    imageProject.clearStaticImage()
    projectExport.invalidate()
  }

  async function uploadFrames(files: FileList | File[]) {
    const previousCount = imageProject.frames.value.length
    await imageProject.uploadFrames(files)
    if (imageProject.frames.value.length > previousCount) {
      timeline.selectFrame(imageProject.frames.value[previousCount]!.id)
      timeline.startPlayback()
      activeTab.value = 'animation'
      projectExport.invalidate()
    }
  }

  function updateImageSettings(patch: Partial<ImageSettings>) {
    imageProject.updateSettings(patch)
    projectExport.invalidate()
  }

  function updateDevice(id: string) {
    deviceId.value = id
    projectExport.invalidate()
  }

  function removeFrame(id: string) {
    timeline.removeFrame(id)
    projectExport.invalidate()
  }

  function removeAllFrames() {
    timeline.removeAllFrames()
    projectExport.invalidate()
  }

  function reorderFrames(from: number, to: number) {
    timeline.reorderFrames(from, to)
    projectExport.invalidate()
  }

  function updateDuration(id: string, duration: number) {
    timeline.updateDuration(id, duration)
    projectExport.invalidate()
  }

  function setPlaybackSpeed(value: number) {
    timeline.playbackSpeed.value = value
    projectExport.invalidate()
  }

  function setLoop(value: boolean) {
    timeline.loopAnimation.value = value
    projectExport.invalidate()
  }

  function setOverlayAnimation(value: boolean) {
    timeline.overlayAnimation.value = value
    projectExport.invalidate()
  }

  function addEffect(type: string) {
    layers.addEffect(type)
    projectExport.invalidate()
  }

  function removeEffect(id: string) {
    layers.removeEffect(id)
    projectExport.invalidate()
  }

  function toggleEffect(id: string, enabled: boolean) {
    layers.toggleEffect(id, enabled)
    projectExport.invalidate()
  }

  function setEffectSetting(id: string, key: string, value: number) {
    layers.setEffectSetting(id, key, value)
    projectExport.invalidate()
  }

  function reorderEffect(id: string, direction: -1 | 1) {
    layers.reorderEffect(id, direction)
    projectExport.invalidate()
  }

  function setActiveTab(tab: string) {
    activeTab.value = tab
  }

  async function generateExport() {
    projectExport.isExporting.value = true
    try {
      let exportTime = 0
      let exportFrames: ExportFrame[]
      const animationFrames = imageProject.frames.value
      if (animationFrames.length) {
        exportFrames = animationFrames.map((frame) => {
          const time = exportTime
          const duration = frame.duration / timeline.playbackSpeed.value
          exportTime += duration / 1000
          const luaCanvas = composeAnimationFrame(frame)
          return {
            canvas: renderComposite(luaCanvas, layers.effects.value, device.value, time),
            luaCanvas,
            duration,
            name: frame.file.name,
          }
        })
      } else {
        const luaCanvas =
          imageProject.processedStatic.value?.canvas ?? createBlankCanvas(device.value)
        exportFrames = [
          {
            canvas: renderComposite(
              luaCanvas,
              layers.effects.value,
              device.value,
              performance.now() / 1000,
            ),
            luaCanvas,
            duration: 120,
            name: imageProject.staticSource.value?.file.name ?? 'blank',
          },
        ]
      }

      await projectExport.generate(
        exportFrames,
        device.value,
        layers.effects.value,
        timeline.loopAnimation.value,
      )
      if (projectExport.result.value) activeTab.value = 'export'
    } catch (reason) {
      projectExport.error.value = reason instanceof Error ? reason.message : 'Export failed'
    } finally {
      projectExport.isExporting.value = false
    }
  }

  onBeforeUnmount(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })

  return {
    activeTab,
    deviceId,
    device,
    devices: deviceProfiles,
    imageSettings: imageProject.imageSettings,
    originalUrl,
    hasStaticImage,
    processedUrl,
    sections: sectionPreviews,
    imageError: imageProject.error,
    isProcessing: imageProject.isProcessing,
    uploadProgress: imageProject.uploadProgress,
    previewImage,
    previewVersion,
    frames: frameSummaries,
    frameCount: exportFrameCount,
    selectedFrameId: timeline.selectedFrameId,
    playbackSpeed: timeline.playbackSpeed,
    loopAnimation: timeline.loopAnimation,
    overlayAnimation: timeline.overlayAnimation,
    isPlaying: timeline.isPlaying,
    effects: layers.effects,
    effectDefinitions: layers.definitions,
    enabledEffects: layers.enabledCount,
    isExporting: projectExport.isExporting,
    exportError: projectExport.error,
    exportResult: projectExport.result,
    archiveUrl: projectExport.archiveUrl,
    exportFiles,
    exportWarnings,
    uploadStatic,
    clearStaticImage,
    uploadFrames,
    updateImageSettings,
    updateDevice,
    selectFrame,
    removeFrame,
    removeAllFrames,
    reorderFrames,
    updateDuration,
    setPlaybackSpeed,
    setLoop,
    setOverlayAnimation,
    togglePlayback: timeline.togglePlayback,
    addEffect,
    removeEffect,
    toggleEffect,
    setEffectSetting,
    reorderEffect,
    setActiveTab,
    generateExport,
  }
}

export type StudioProject = ReturnType<typeof useStudioProject>
