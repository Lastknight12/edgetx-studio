import { computed, ref, type ShallowRef } from 'vue'
import type { StudioFrame } from './useImageProject'

export function useAnimationTimeline(frames: ShallowRef<StudioFrame[]>) {
  const selectedFrameId = ref<string | null>(null)
  const playbackSpeed = ref(1)
  const loopAnimation = ref(true)
  const overlayAnimation = ref(true)
  const isPlaying = ref(false)
  let playbackStart = 0
  let playbackInitialIndex = 0

  const selectedFrame = computed(
    () => frames.value.find((frame) => frame.id === selectedFrameId.value) ?? null,
  )

  function selectFrame(id: string) {
    selectedFrameId.value = id
  }

  function removeFrame(id: string) {
    const removed = frames.value.find((frame) => frame.id === id)
    if (removed) URL.revokeObjectURL(removed.url)
    const remaining = frames.value.filter((frame) => frame.id !== id)
    frames.value = remaining
    if (selectedFrameId.value === id) selectedFrameId.value = remaining[0]?.id ?? null
    if (!remaining.length) isPlaying.value = false
  }

  function removeAllFrames() {
    for (const frame of frames.value) URL.revokeObjectURL(frame.url)
    frames.value = []
    selectedFrameId.value = null
    isPlaying.value = false
  }

  function reorderFrames(from: number, to: number) {
    if (to < 0 || from < 0 || from >= frames.value.length || to >= frames.value.length) return
    const reordered = [...frames.value]
    const [frame] = reordered.splice(from, 1)
    if (frame) reordered.splice(to, 0, frame)
    frames.value = reordered
    if (isPlaying.value) {
      playbackStart = performance.now()
      playbackInitialIndex = Math.max(
        0,
        reordered.findIndex((item) => item.id === selectedFrameId.value),
      )
    }
  }

  function updateDuration(id: string, duration: number) {
    frames.value = frames.value.map((frame) => (frame.id === id ? { ...frame, duration } : frame))
  }

  function togglePlayback() {
    if (isPlaying.value) {
      isPlaying.value = false
      return
    }
    if (!frames.value.length) return
    playbackStart = performance.now()
    playbackInitialIndex = Math.max(
      0,
      frames.value.findIndex((frame) => frame.id === selectedFrameId.value),
    )
    isPlaying.value = true
  }

  function advance(now: number) {
    if (!isPlaying.value || !frames.value.length) return
    const items = frames.value
    const offset = items
      .slice(0, playbackInitialIndex)
      .reduce((sum, frame) => sum + frame.duration, 0)
    const duration = items.reduce((sum, frame) => sum + frame.duration, 0)
    const elapsed = (now - playbackStart) * playbackSpeed.value + offset
    if (!loopAnimation.value && elapsed >= duration) {
      selectedFrameId.value = items[items.length - 1]!.id
      isPlaying.value = false
      return
    }
    let remaining =
      loopAnimation.value && duration > 0 ? elapsed % duration : Math.min(elapsed, duration - 1)
    const active = items.find((frame) => {
      remaining -= frame.duration
      return remaining < 0
    })
    if (active) selectedFrameId.value = active.id
  }

  return {
    selectedFrameId,
    selectedFrame,
    playbackSpeed,
    loopAnimation,
    overlayAnimation,
    isPlaying,
    selectFrame,
    removeFrame,
    removeAllFrames,
    reorderFrames,
    updateDuration,
    togglePlayback,
    advance,
  }
}
