<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

defineProps<{ modelValue: boolean; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <SwitchRoot
    :model-value="modelValue"
    :aria-label="label"
    class="relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-zinc-800 transition-colors data-[state=checked]:border-violet-300/30 data-[state=checked]:bg-violet-400/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SwitchThumb
      class="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-zinc-400 shadow-sm transition-transform data-[state=checked]:translate-x-[15px] data-[state=checked]:bg-white"
    />
  </SwitchRoot>
</template>
