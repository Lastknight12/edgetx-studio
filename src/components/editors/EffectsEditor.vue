<script setup lang="ts">
import { ArrowDown, ArrowUp, Layers2, Sparkles, Trash2 } from '@lucide/vue'
import type { EffectDefinition, EffectInstance } from '@/types/studio'
import UiIconButton from '@/components/ui/UiIconButton.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiSlider from '@/components/ui/UiSlider.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'

defineProps<{ definitions: EffectDefinition[]; effects: EffectInstance[] }>()
const emit = defineEmits<{
  add: [type: string]
  remove: [id: string]
  toggle: [id: string, enabled: boolean]
  setting: [id: string, key: string, value: number]
  reorder: [id: string, direction: -1 | 1]
}>()
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="mb-0 mt-1 text-sm font-medium tracking-tight text-zinc-200">Effects library</h3>
        <p class="mt-1 text-[10px] text-zinc-500">
          Effects render over your image in the display preview.
        </p>
      </div>
      <UiSelect
        model-value=""
        :options="definitions.map(({ id, name }) => ({ value: id, label: name }))"
        label="Add an effect"
        placeholder="Add effect"
        @update:model-value="emit('add', $event)"
      />
    </div>

    <div v-if="effects.length" class="mt-5 space-y-3">
      <article
        v-for="(effect, index) in effects"
        :key="effect.id"
        class="rounded-lg border p-3 transition-colors"
        :class="
          effect.enabled
            ? 'border-white/[0.08] bg-black/10'
            : 'border-white/[0.04] bg-black/5 opacity-60'
        "
      >
        <header class="flex items-start gap-3">
          <div
            class="grid size-8 shrink-0 place-items-center rounded-md border border-violet-300/10 bg-violet-300/[0.06] text-violet-200"
          >
            <Sparkles :size="14" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-zinc-200">
              {{ definitions.find((definition) => definition.id === effect.type)?.name }}
            </p>
            <p class="mt-1 text-[10px] leading-relaxed text-zinc-500">
              {{ definitions.find((definition) => definition.id === effect.type)?.description }}
            </p>
          </div>
          <div class="flex items-center gap-0.5">
            <UiIconButton
              label="Move layer up"
              :disabled="index === 0"
              @click="emit('reorder', effect.id, -1)"
              ><ArrowUp :size="12"
            /></UiIconButton>
            <UiIconButton
              label="Move layer down"
              :disabled="index === effects.length - 1"
              @click="emit('reorder', effect.id, 1)"
              ><ArrowDown :size="12"
            /></UiIconButton>
            <UiIconButton label="Remove effect" variant="danger" @click="emit('remove', effect.id)"
              ><Trash2 :size="12"
            /></UiIconButton>
          </div>
        </header>
        <div class="mt-4 space-y-3">
          <label
            v-for="option in definitions.find((definition) => definition.id === effect.type)
              ?.options ?? []"
            :key="option.key"
            class="block"
          >
            <span class="mb-1 flex justify-between text-[11px] text-zinc-400">
              {{ option.label }}
              <b class="font-medium tabular-nums text-zinc-300">{{
                effect.settings[option.key]
              }}</b>
            </span>
            <UiSlider
              :model-value="Number(effect.settings[option.key] ?? option.min)"
              :min="option.min"
              :max="option.max"
              :step="option.step"
              :label="option.label"
              @update:model-value="emit('setting', effect.id, option.key, $event)"
            />
          </label>
          <div class="flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span>
              <strong class="block text-[11px] font-medium text-zinc-300">Effect enabled</strong>
              <small class="mt-1 flex items-center gap-1 text-[10px] text-zinc-500"
                ><Layers2 :size="11" />Layer {{ String(index + 1).padStart(2, '0') }}</small
              >
            </span>
            <UiSwitch
              :model-value="effect.enabled"
              :label="`Enable ${definitions.find((item) => item.id === effect.type)?.name ?? 'effect'}`"
              @update:model-value="emit('toggle', effect.id, $event)"
            />
          </div>
        </div>
      </article>
    </div>
    <div
      v-else
      class="mt-5 flex flex-col items-center rounded-lg border border-dashed border-white/[0.07] px-5 py-8 text-center"
    >
      <Sparkles :size="22" class="text-zinc-600" />
      <p class="mb-0 mt-3 text-xs text-zinc-400">Nothing on the canvas</p>
      <span class="mt-1 text-[10px] text-zinc-600">Add a layer to build a visual effect.</span>
    </div>
  </div>
</template>
