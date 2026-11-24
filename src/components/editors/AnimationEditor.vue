<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, Film, Pause, Play, Plus, Trash2 } from '@lucide/vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIconButton from '@/components/ui/UiIconButton.vue'
import UiSlider from '@/components/ui/UiSlider.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'

export interface FrameSummary {
  id: string
  name: string
  url: string
  duration: number
}

const props = defineProps<{
  frames: FrameSummary[]
  selectedId: string | null
  speed: number
  loop: boolean
  overlayOnImage: boolean
  playing: boolean
  busy: boolean
}>()
const emit = defineEmits<{
  upload: [files: FileList | File[]]
  select: [id: string]
  remove: [id: string]
  removeAll: []
  reorder: [from: number, to: number]
  duration: [id: string, value: number]
  'update:speed': [value: number]
  'update:loop': [value: boolean]
  'update:overlayOnImage': [value: boolean]
  togglePlayback: []
}>()
const isDragging = ref(false)
const dragIndex = ref(-1)
const input = ref<HTMLInputElement | null>(null)
const frameList = ref<HTMLElement | null>(null)
const frameScrollTop = ref(0)
const frameRowStride = 64
const frameWindowSize = 12
const totalDuration = computed(
  () => props.frames.reduce((sum, frame) => sum + frame.duration, 0) / props.speed,
)
const visibleFrameStart = computed(() =>
  Math.max(0, Math.floor(frameScrollTop.value / frameRowStride) - 2),
)
const visibleFrames = computed(() =>
  props.frames
    .slice(visibleFrameStart.value, visibleFrameStart.value + frameWindowSize)
    .map((frame, offset) => ({ frame, index: visibleFrameStart.value + offset })),
)

function updateFrameScroll() {
  frameScrollTop.value = frameList.value?.scrollTop ?? 0
}

function accept(files: FileList | File[] | null) {
  if (files?.length) emit('upload', files)
  if (input.value) input.value.value = ''
}

function drop(event: DragEvent) {
  isDragging.value = false
  accept(event.dataTransfer?.files ?? null)
}

function reorder(to: number) {
  if (dragIndex.value >= 0 && dragIndex.value !== to) emit('reorder', dragIndex.value, to)
  dragIndex.value = -1
}
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="mb-0 mt-1 text-sm font-medium tracking-tight text-zinc-200">
          Animation timeline
        </h3>
        <p class="mt-1 text-[10px] text-zinc-500">
          {{ frames.length }} frames · {{ (totalDuration / 1000).toFixed(2) }} sec total
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <UiButton
          v-if="frames.length"
          variant="danger"
          size="small"
          :disabled="busy"
          @click="emit('removeAll')"
        >
          <Trash2 :size="12" /> Delete all frames
        </UiButton>
        <UiButton size="small" :disabled="busy" @click="input?.click()">
          <Plus :size="13" />Add frames
        </UiButton>
      </div>
      <input
        ref="input"
        class="hidden"
        type="file"
        multiple
        :disabled="busy"
        accept=".png,.jpg,.jpeg,.bmp,.webp,image/*"
        @change="accept(($event.target as HTMLInputElement).files)"
      />
    </div>

    <div
      data-file-drop-zone
      class="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-[10px] text-zinc-500 transition-colors"
      :class="
        isDragging
          ? 'border-violet-300/50 bg-violet-300/[0.06]'
          : 'border-white/10 bg-white/[0.015]'
      "
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="drop"
    >
      <Film :size="15" />Drop multiple images here to add frames
    </div>
    <div
      v-if="frames.length"
      ref="frameList"
      class="mt-3 max-h-96 overflow-y-auto rounded-lg"
      @scroll.passive="updateFrameScroll"
    >
      <div class="relative" :style="{ height: `${frames.length * frameRowStride}px` }">
        <div
          class="absolute inset-x-0 space-y-1.5"
          :style="{ top: `${visibleFrameStart * frameRowStride}px` }"
        >
          <div
            v-for="{ frame, index } in visibleFrames"
            :key="frame.id"
            class="flex h-[58px] items-center gap-2 rounded-lg border px-2 transition-colors"
            :class="
              frame.id === selectedId
                ? 'border-violet-300/20 bg-violet-300/[0.05]'
                : 'border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.035]'
            "
            draggable="true"
            @dragstart="dragIndex = index"
            @dragover.prevent
            @drop.prevent="reorder(index)"
            @click="emit('select', frame.id)"
          >
            <span class="w-5 shrink-0 text-center font-mono text-[9px] text-zinc-600">{{
              String(index + 1).padStart(2, '0')
            }}</span>
            <img
              :src="frame.url"
              :alt="frame.name"
              class="size-10 shrink-0 rounded border border-white/[0.07] bg-zinc-900 object-contain [image-rendering:pixelated]"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[11px] font-medium text-zinc-300">{{ frame.name }}</p>
              <p class="mt-1 text-[9px] text-zinc-600">{{ frame.duration }} ms</p>
            </div>
            <UiIconButton
              label="Move frame up"
              :disabled="index === 0"
              @click.stop="emit('reorder', index, index - 1)"
              ><ArrowUp :size="12"
            /></UiIconButton>
            <UiIconButton
              label="Move frame down"
              :disabled="index === frames.length - 1"
              @click.stop="emit('reorder', index, index + 1)"
              ><ArrowDown :size="12"
            /></UiIconButton>
            <UiIconButton
              label="Remove frame"
              variant="danger"
              @click.stop="emit('remove', frame.id)"
              ><Trash2 :size="12"
            /></UiIconButton>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="mt-3 flex flex-col items-center rounded-lg border border-dashed border-white/[0.07] px-5 py-8 text-center"
    >
      <Film :size="22" class="text-zinc-600" />
      <p class="mb-0 mt-3 text-xs text-zinc-400">No frames yet</p>
      <span class="mt-1 text-[10px] text-zinc-600"
        >Add images to build a transmitter animation.</span
      >
    </div>

    <div class="mb-3 mt-6 text-[9px] font-semibold tracking-[0.14em] text-zinc-500">PLAYBACK</div>
    <div class="space-y-3">
      <label class="block">
        <span class="mb-1 flex justify-between text-[11px] text-zinc-400"
          >Playback speed
          <b class="font-medium tabular-nums text-zinc-300">{{ speed.toFixed(1) }}×</b></span
        >
        <UiSlider
          :model-value="speed"
          :min="0.25"
          :max="3"
          :step="0.05"
          label="Playback speed"
          @update:model-value="emit('update:speed', $event)"
        />
      </label>
      <label v-if="selectedId" class="block">
        <span class="mb-1 flex justify-between text-[11px] text-zinc-400">
          Selected frame duration
          <b class="font-medium tabular-nums text-zinc-300"
            >{{ frames.find((frame) => frame.id === selectedId)?.duration ?? 120 }} ms</b
          >
        </span>
        <UiSlider
          :model-value="frames.find((frame) => frame.id === selectedId)?.duration ?? 120"
          :min="40"
          :max="1200"
          :step="10"
          label="Selected frame duration"
          @update:model-value="emit('duration', selectedId, $event)"
        />
      </label>
      <div class="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span
          ><strong class="block text-[11px] font-medium text-zinc-300">Loop playback</strong
          ><small class="mt-1 block text-[10px] text-zinc-500"
            >Restart after the final frame</small
          ></span
        >
        <UiSwitch
          :model-value="loop"
          label="Loop playback"
          @update:model-value="emit('update:loop', $event)"
        />
      </div>
      <div class="flex items-center justify-between gap-3">
        <span
          ><strong class="block text-[11px] font-medium text-zinc-300"
            >Overlay on static image</strong
          ><small class="mt-1 block text-[10px] text-zinc-500"
            >Use frame ink over the Image tab canvas</small
          ></span
        >
        <UiSwitch
          :model-value="overlayOnImage"
          label="Overlay animation on static image"
          @update:model-value="emit('update:overlayOnImage', $event)"
        />
      </div>
    </div>
    <UiButton
      class="mt-5 w-full"
      variant="primary"
      :disabled="!frames.length"
      @click="emit('togglePlayback')"
    >
      <Pause v-if="playing" :size="14" /><Play v-else :size="14" />
      {{ playing ? 'Pause preview' : 'Play preview' }}
    </UiButton>
  </div>
</template>
