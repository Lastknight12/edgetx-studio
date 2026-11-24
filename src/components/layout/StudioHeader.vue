<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Aperture, Star } from '@lucide/vue'
import { siGithub } from 'simple-icons'
import type { DeviceProfile } from '@/types/studio'
import UiSelect from '@/components/ui/UiSelect.vue'

defineProps<{
  deviceId: string
  devices: DeviceProfile[]
}>()
const emit = defineEmits<{ 'update:deviceId': [value: string] }>()
const starCount = ref<number | null>(null)

onMounted(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/LastKnight12/edgetx-studio', {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) return
    const repository = (await response.json()) as { stargazers_count?: unknown }
    if (typeof repository.stargazers_count === 'number') {
      starCount.value = repository.stargazers_count
    }
  } catch {
    // Keep the repository link available if GitHub cannot be reached.
  }
})
</script>

<template>
  <header
    class="flex h-[58px] shrink-0 items-center gap-5 border-b border-white/[0.075] bg-[#0c0d10]/95 px-4 sm:px-7"
  >
    <a
      class="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.13em] text-zinc-300 no-underline"
      href="#"
      aria-label="EdgeTX Studio home"
    >
      <span
        class="grid size-7 place-items-center rounded-lg border border-violet-300/20 bg-violet-300/10 text-violet-200"
      >
        <Aperture :size="17" />
      </span>
      <span>EDGETX <b class="font-medium text-zinc-500">STUDIO</b></span>
    </a>
    <div class="hidden h-5 w-px bg-white/[0.08] sm:block"></div>
    <div class="flex min-w-0 items-center gap-2">
      <UiSelect
        :model-value="deviceId"
        :options="devices.map(({ id, name }) => ({ value: id, label: name }))"
        label="Selected transmitter"
        @update:model-value="emit('update:deviceId', $event)"
      />
    </div>
    <div class="ml-auto flex items-center gap-3">
      <a
        class="inline-flex min-h-8 items-center gap-2 rounded-md border border-violet-300/20 bg-violet-300/[0.09] px-3 text-xs font-medium text-violet-100 transition-colors hover:border-violet-200/35 hover:bg-violet-300/[0.16]"
        href="https://github.com/LastKnight12/edgetx-studio"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="EdgeTX Studio on GitHub"
      >
        <svg class="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path :d="siGithub.path" />
        </svg>
        <span>GitHub</span>
        <span
          v-if="starCount !== null"
          class="inline-flex items-center gap-1 border-l border-violet-200/15 pl-2 text-violet-100/80"
          aria-label="GitHub stars"
        >
          <Star :size="12" />{{ starCount.toLocaleString() }}
        </span>
      </a>
    </div>
  </header>
</template>
