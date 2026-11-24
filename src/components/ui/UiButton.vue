<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'default' | 'small' | 'icon'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'secondary',
    size: 'default',
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-40',
      variant === 'primary' &&
        'border-violet-300/20 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25',
      variant === 'secondary' &&
        'border-white/[0.09] bg-white/[0.035] text-zinc-300 hover:bg-white/[0.075] hover:text-zinc-100',
      variant === 'ghost' &&
        'border-transparent bg-transparent text-zinc-400 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-zinc-100',
      variant === 'danger' &&
        'border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/20 hover:text-red-200',
      size === 'default' && 'min-h-9 px-3 text-xs',
      size === 'small' && 'min-h-7 px-2 text-[11px]',
      size === 'icon' && 'size-7 p-0',
    ]"
  >
    <slot />
  </button>
</template>
