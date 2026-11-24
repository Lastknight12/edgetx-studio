<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
  step: number
  label: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function update(values: number[] | undefined) {
  const value = values?.[0]
  if (typeof value === 'number') emit('update:modelValue', value)
}
</script>

<template>
  <SliderRoot
    :model-value="[props.modelValue]"
    :min="min"
    :max="max"
    :step="step"
    :aria-label="label"
    class="relative flex h-5 w-full touch-none select-none items-center"
    @update:model-value="update"
  >
    <SliderTrack class="relative h-1 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderRange class="absolute h-full rounded-full bg-violet-300/80" />
    </SliderTrack>
    <SliderThumb
      class="block size-3 rounded-full border border-violet-200/40 bg-zinc-100 shadow-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    />
  </SliderRoot>
</template>
