<script setup lang="ts">
import { computed, ref } from 'vue'
import { Aperture, Image as ImageIcon, Trash2, UploadCloud } from '@lucide/vue'
import type { ImageSettings } from '@/types/studio'
import UiButton from '@/components/ui/UiButton.vue'
import UiSlider from '@/components/ui/UiSlider.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'

const props = defineProps<{
  settings: ImageSettings
  originalUrl: string | null
  hasStaticImage: boolean
  processedUrl: string | null
  sections: [string, string] | null
  busy: boolean
  deviceWidth: number
}>()
const emit = defineEmits<{
  upload: [files: FileList | File[]]
  clear: []
  'update:settings': [settings: Partial<ImageSettings>]
}>()
const isDragging = ref(false)
const input = ref<HTMLInputElement | null>(null)
const canUpload = computed(() => !props.busy)

function accept(files: FileList | File[] | null) {
  if (files?.length) emit('upload', files)
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5">
    <div
      data-file-drop-zone
      class="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-3 transition-colors"
      :class="
        isDragging
          ? 'border-violet-300/50 bg-violet-300/[0.06]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
      "
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="((isDragging = false), accept($event.dataTransfer?.files ?? null))"
      @click="input?.click()"
    >
      <input
        ref="input"
        class="hidden"
        type="file"
        :disabled="!canUpload"
        accept=".png,.jpg,.jpeg,.bmp,.webp,.gif,image/png,image/jpeg,image/bmp,image/webp,image/gif"
        @change="accept(($event.target as HTMLInputElement).files)"
      />
      <span
        class="grid size-9 shrink-0 place-items-center rounded-md border border-violet-300/15 bg-violet-300/[0.07] text-violet-200"
      >
        <UploadCloud :size="18" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-xs font-medium text-zinc-200">Drop an image to get started</p>
        <p class="mt-1 text-[10px] text-zinc-500">PNG, JPG, BMP or WebP</p>
      </div>
      <UiButton size="small" :disabled="!canUpload" @click.stop="input?.click()"> Browse </UiButton>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <div class="min-w-0 rounded-lg border border-white/[0.07] bg-black/10 p-2">
        <div
          class="mb-2 flex items-center justify-between text-[9px] tracking-[0.1em] text-zinc-500"
        >
          <span class="flex items-center gap-1.5"><ImageIcon :size="13" />ORIGINAL</span>
          <UiButton
            v-if="hasStaticImage"
            variant="danger"
            size="small"
            :disabled="busy"
            aria-label="Clear uploaded image"
            title="Clear uploaded image"
            @click="emit('clear')"
          >
            <Trash2 :size="12" />Clear
          </UiButton>
        </div>
        <div
          class="flex min-h-24 items-center justify-center rounded border border-white/[0.05] bg-[#0b0c0f] p-2"
        >
          <img
            v-if="originalUrl"
            :src="originalUrl"
            alt="Original uploaded image"
            class="block object-contain"
            style="max-width: min(100%, 320px); max-height: 240px; width: auto; height: auto"
          />
          <span v-else class="text-[9px] tracking-wider text-zinc-700">NO SOURCE</span>
        </div>
      </div>
      <div class="min-w-0 rounded-lg border border-white/[0.07] bg-black/10 p-2">
        <div
          class="mb-2 flex items-center justify-between text-[9px] tracking-[0.1em] text-zinc-500"
        >
          <span>PROCESSED · {{ settings.dither ? 'DITHERED' : 'THRESHOLD' }}</span
          ><Aperture :size="13" />
        </div>
        <div
          class="grid h-24 place-items-center overflow-hidden rounded border border-white/[0.05] bg-zinc-800"
        >
          <img
            v-if="processedUrl"
            :src="processedUrl"
            alt="Processed monochrome image"
            class="max-h-full max-w-full object-contain [image-rendering:pixelated]"
          />
          <span v-else class="text-[9px] tracking-wider text-zinc-700">NO OUTPUT</span>
        </div>
      </div>
    </div>

    <div class="mb-3 mt-6 text-[9px] font-semibold tracking-[0.14em] text-zinc-500">PROCESSING</div>
    <div class="space-y-3">
      <label
        v-for="control in [
          {
            key: 'brightness',
            label: 'Brightness',
            min: -100,
            max: 100,
            step: 1,
            value: settings.brightness,
          },
          {
            key: 'contrast',
            label: 'Contrast',
            min: -100,
            max: 100,
            step: 1,
            value: settings.contrast,
          },
          {
            key: 'threshold',
            label: 'Threshold',
            min: 0,
            max: 255,
            step: 1,
            value: settings.threshold,
          },
          {
            key: 'scale',
            label: 'Image scale',
            min: 0.5,
            max: 2,
            step: 0.05,
            value: settings.scale,
          },
          {
            key: 'cropX',
            label: 'Crop horizontal',
            min: -100,
            max: 100,
            step: 1,
            value: settings.cropX,
          },
          {
            key: 'cropY',
            label: 'Crop vertical',
            min: -100,
            max: 100,
            step: 1,
            value: settings.cropY,
          },
        ]"
        :key="control.key"
        class="block"
      >
        <span class="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
          {{ control.label }}
          <b class="font-medium tabular-nums text-zinc-300">{{
            control.key === 'scale' ? `${control.value.toFixed(2)}×` : control.value
          }}</b>
        </span>
        <UiSlider
          :model-value="control.value"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          :label="control.label"
          @update:model-value="emit('update:settings', { [control.key]: $event })"
        />
      </label>
      <div class="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span>
          <strong class="block text-[11px] font-medium text-zinc-300"
            >Floyd–Steinberg dithering</strong
          >
          <small class="mt-1 block text-[10px] text-zinc-500"
            >Preserve tonal detail in monochrome</small
          >
        </span>
        <UiSwitch
          :model-value="settings.dither"
          label="Floyd–Steinberg dithering"
          @update:model-value="emit('update:settings', { dither: $event })"
        />
      </div>
      <div class="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span>
          <strong class="block text-[11px] font-medium text-zinc-300">Invert colors</strong>
          <small class="mt-1 block text-[10px] text-zinc-500"
            >Swap black and white on the image and animation</small
          >
        </span>
        <UiSwitch
          :model-value="settings.invert"
          label="Invert image and animation colors"
          @update:model-value="emit('update:settings', { invert: $event })"
        />
      </div>
    </div>

    <div
      class="mb-3 mt-6 flex items-center justify-between text-[9px] font-semibold tracking-[0.14em] text-zinc-500"
    >
      <span>IMAGE SPLIT</span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="(section, index) in sections ?? [null, null]"
        :key="index"
        class="min-w-0 rounded-lg border border-white/[0.07] bg-black/10 p-2"
      >
        <div class="mb-2 flex items-center justify-between text-[9px] text-zinc-500">
          <span>{{ index === 0 ? 'LEFT HALF' : 'RIGHT HALF' }}</span>
          <span
            >{{
              index === 0 ? Math.floor(deviceWidth / 2) : deviceWidth - Math.floor(deviceWidth / 2)
            }}
            PX</span
          >
        </div>
        <div
          class="grid min-h-16 max-h-[320px] place-items-center overflow-hidden rounded border border-white/[0.05] bg-zinc-800"
        >
          <img
            v-if="section"
            :src="section"
            :alt="`${index === 0 ? 'Left' : 'Right'} image section`"
            class="max-h-[300px] max-w-full object-contain [image-rendering:pixelated]"
            :style="{ width: `min(${Math.min(Math.floor(deviceWidth / 2) * 4, 512)}px, 100%)` }"
          />
          <span v-else class="text-zinc-700">—</span>
        </div>
      </div>
    </div>
    <p class="mt-3 text-[10px] leading-relaxed text-zinc-600">
      Sections are exported as 1-bit BMP assets to keep per-file memory use low.
    </p>
  </div>
</template>
