<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

export interface SelectOption {
  label: string
  value: string
}

defineProps<{
  modelValue: string
  options: SelectOption[]
  label: string
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :aria-label="label"
    @update:model-value="(value) => typeof value === 'string' && emit('update:modelValue', value)"
  >
    <SelectTrigger
      class="inline-flex min-w-0 items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-zinc-950/60 px-2.5 py-2 text-xs text-zinc-300 outline-none transition-colors hover:border-white/15 focus-visible:ring-2 focus-visible:ring-violet-400/70"
    >
      <SelectValue :placeholder="placeholder ?? 'Select…'" />
      <ChevronDown :size="13" class="shrink-0 text-zinc-500" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="5"
        class="z-50 max-h-60 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-md border border-white/10 bg-zinc-900 p-1 text-xs text-zinc-300 shadow-xl"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="relative flex cursor-pointer select-none items-center rounded px-2 py-2 outline-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-zinc-100 data-[state=checked]:text-violet-200"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
