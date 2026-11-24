<script setup lang="ts">
import { watch, ref } from 'vue'
import { Pause, Play, ZoomIn, ZoomOut } from '@lucide/vue'
import type { DeviceProfile } from '@/types/studio'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps<{
  device: DeviceProfile
  image: HTMLCanvasElement
  imageVersion: number
  playing: boolean
  canPlay: boolean
}>()
const emit = defineEmits<{ togglePlayback: [] }>()
const screen = ref<HTMLCanvasElement | null>(null)
const zoomLevel = ref(4)

watch(
  () => [props.image, props.imageVersion, props.device.width, props.device.height],
  () => {
    const canvas = screen.value
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    if (canvas.width !== props.device.width) canvas.width = props.device.width
    if (canvas.height !== props.device.height) canvas.height = props.device.height
    context.imageSmoothingEnabled = false
    context.drawImage(props.image, 0, 0, props.device.width, props.device.height)
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <section
    class="flex min-h-[400px] min-w-0 flex-col self-start overflow-hidden rounded-xl border border-white/[0.075] bg-gradient-to-br from-[#14151a] to-[#0f1014] lg:sticky lg:top-4"
  >
    <header
      class="flex items-center justify-between gap-3 border-b border-white/[0.075] px-4 py-4 sm:px-5"
    >
      <div>
        <h2 class="mb-0 mt-1 text-[13px] font-medium tracking-tight text-zinc-200">
          Display preview
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 text-[10px] tracking-wide text-zinc-500">
          <span
            class="size-1.5 rounded-full"
            :class="
              playing ? 'bg-violet-300 shadow-[0_0_9px_rgba(156,139,255,0.7)]' : 'bg-zinc-600'
            "
          ></span>
          {{ playing ? 'PLAYING' : 'READY' }}
        </div>
        <UiButton
          variant="primary"
          size="icon"
          :aria-label="playing ? 'Pause animation preview' : 'Play animation preview'"
          :title="playing ? 'Pause animation preview' : 'Play animation preview'"
          :disabled="!canPlay"
          @click="emit('togglePlayback')"
        >
          <Pause v-if="playing" :size="13" />
          <Play v-else :size="13" />
        </UiButton>
      </div>
    </header>

    <div
      class="relative flex min-h-[300px] flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(rgba(255,255,255,0.045)_0.7px,transparent_0.7px)] [background-size:17px_17px] px-3 py-4"
    >
      <canvas
        ref="screen"
        class="block max-w-full shrink-0 bg-white [image-rendering:pixelated] [image-rendering:crisp-edges]"
        :style="{
          width: `min(${Math.min(device.width * zoomLevel, 512)}px, 100%)`,
          height: 'auto',
        }"
        aria-label="Transmitter display preview"
      />
    </div>

    <div class="flex items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-2">
      <button
        type="button"
        class="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Zoom out"
        title="Zoom out"
        :disabled="zoomLevel === 1"
        @click="zoomLevel = Math.max(1, zoomLevel - 1)"
      >
        <ZoomOut :size="14" />
      </button>
      <span class="min-w-10 text-center text-[10px] tabular-nums text-zinc-500">
        {{ zoomLevel }}×
      </span>
      <button
        type="button"
        class="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Zoom in"
        title="Zoom in"
        :disabled="zoomLevel === 4"
        @click="zoomLevel = Math.min(4, zoomLevel + 1)"
      >
        <ZoomIn :size="14" />
      </button>
    </div>

    <div class="mt-auto grid grid-cols-3 gap-2 border-t border-white/[0.06] px-4 py-4 sm:px-5">
      <div class="flex min-w-0 flex-col gap-1.5">
        <span class="text-[8px] tracking-[0.11em] text-zinc-600">RESOLUTION</span
        ><strong class="truncate text-[10px] font-medium text-zinc-300"
          >{{ device.width }} × {{ device.height }}</strong
        >
      </div>
      <div class="flex min-w-0 flex-col gap-1.5">
        <span class="text-[8px] tracking-[0.11em] text-zinc-600">COLOR DEPTH</span
        ><strong class="truncate text-[10px] font-medium text-zinc-300"
          >{{ device.colorDepth }}-bit · 2 tones</strong
        >
      </div>
      <div class="flex min-w-0 flex-col gap-1.5">
        <span class="text-[8px] tracking-[0.11em] text-zinc-600">PIXEL COUNT</span
        ><strong class="truncate text-[10px] font-medium text-zinc-300">{{
          (device.width * device.height).toLocaleString()
        }}</strong>
      </div>
    </div>
  </section>
</template>
