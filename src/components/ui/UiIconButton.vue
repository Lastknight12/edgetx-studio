<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import UiButton from './UiButton.vue'

defineProps<{
  label: string
  disabled?: boolean
  variant?: 'ghost' | 'danger'
}>()
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <TooltipProvider :delay-duration="500">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <UiButton
          :variant="variant ?? 'ghost'"
          size="icon"
          :disabled="disabled"
          :aria-label="label"
          @click="emit('click', $event)"
        >
          <slot />
        </UiButton>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side="top"
          :side-offset="6"
          class="z-50 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 shadow-xl"
        >
          {{ label }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
