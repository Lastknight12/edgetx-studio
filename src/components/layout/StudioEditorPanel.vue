<script setup lang="ts">
import { Aperture, Download, Layers2, Sparkles } from '@lucide/vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import AnimationEditor from '@/components/editors/AnimationEditor.vue'
import EffectsEditor from '@/components/editors/EffectsEditor.vue'
import ExportEditor from '@/components/editors/ExportEditor.vue'
import ImageEditor from '@/components/editors/ImageEditor.vue'
import type { StudioProject } from '@/composables/useStudioProject'

const props = defineProps<{ project: StudioProject; activeTab: string }>()
const emit = defineEmits<{ 'update:activeTab': [value: string] }>()
const {
  device,
  imageSettings,
  originalUrl,
  hasStaticImage,
  processedUrl,
  sections,
  isProcessing,
  frames,
  selectedFrameId,
  playbackSpeed,
  loopAnimation,
  overlayAnimation,
  isPlaying,
  effects,
  effectDefinitions,
  enabledEffects,
  isExporting,
  exportError,
  archiveUrl,
  exportResult,
  exportFiles,
  exportWarnings,
  frameCount,
} = props.project

function updateTab(value: string | number) {
  if (typeof value === 'string') emit('update:activeTab', value)
}
</script>

<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.075] bg-gradient-to-br from-[#14151a] to-[#0f1014]"
  >
    <TabsRoot
      :model-value="activeTab"
      class="flex min-h-0 flex-1 flex-col"
      @update:model-value="updateTab"
    >
      <header
        class="flex flex-col items-start justify-between gap-3 border-b border-white/[0.075] px-4 py-4 sm:px-5"
      >
        <div class="min-w-0">
          <h2 class="mb-0 mt-1 text-[13px] font-medium tracking-tight text-zinc-200">
            Canvas controls
          </h2>
        </div>
        <TabsList
          class="flex w-full gap-0.5 rounded-lg border border-white/[0.045] bg-[#0c0d10] p-[3px]"
          aria-label="Editor mode"
        >
          <TabsTrigger
            value="image"
            class="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-2 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300 data-[state=active]:border-white/[0.07] data-[state=active]:bg-[#1c1d23] data-[state=active]:text-zinc-200 [&[data-state=active]>svg]:text-violet-200"
          >
            <Aperture :size="13" /><span>Image</span>
          </TabsTrigger>
          <TabsTrigger
            value="animation"
            class="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-2 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300 data-[state=active]:border-white/[0.07] data-[state=active]:bg-[#1c1d23] data-[state=active]:text-zinc-200 [&[data-state=active]>svg]:text-violet-200"
          >
            <Layers2 :size="13" /><span>Animation</span>
          </TabsTrigger>
          <TabsTrigger
            value="effects"
            class="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-2 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300 data-[state=active]:border-white/[0.07] data-[state=active]:bg-[#1c1d23] data-[state=active]:text-zinc-200 [&[data-state=active]>svg]:text-violet-200"
          >
            <Sparkles :size="13" /><span>Effects</span>
            <i
              v-if="enabledEffects"
              class="grid size-3.5 place-items-center rounded-full bg-violet-300/10 text-[9px] not-italic text-violet-200"
              >{{ enabledEffects }}</i
            >
          </TabsTrigger>
          <TabsTrigger
            value="export"
            class="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-2 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300 data-[state=active]:border-white/[0.07] data-[state=active]:bg-[#1c1d23] data-[state=active]:text-zinc-200 [&[data-state=active]>svg]:text-violet-200"
          >
            <Download :size="13" /><span>Export</span>
          </TabsTrigger>
        </TabsList>
      </header>

      <TabsContent value="image" class="min-h-0 flex-1 data-[state=inactive]:hidden">
        <ImageEditor
          :settings="imageSettings"
          :original-url="originalUrl"
          :has-static-image="hasStaticImage"
          :processed-url="processedUrl"
          :sections="sections"
          :busy="isProcessing"
          :device-width="device.width"
          @upload="project.uploadStatic"
          @clear="project.clearStaticImage"
          @update:settings="project.updateImageSettings"
        />
      </TabsContent>
      <TabsContent value="animation" class="min-h-0 flex-1 data-[state=inactive]:hidden">
        <AnimationEditor
          :frames="frames"
          :selected-id="selectedFrameId"
          :speed="playbackSpeed"
          :loop="loopAnimation"
          :overlay-on-image="overlayAnimation"
          :playing="isPlaying"
          :busy="isProcessing"
          @upload="project.uploadFrames"
          @select="project.selectFrame"
          @remove="project.removeFrame"
          @remove-all="project.removeAllFrames"
          @reorder="project.reorderFrames"
          @duration="project.updateDuration"
          @update:speed="project.setPlaybackSpeed"
          @update:loop="project.setLoop"
          @update:overlay-on-image="project.setOverlayAnimation"
          @toggle-playback="project.togglePlayback"
        />
      </TabsContent>
      <TabsContent value="effects" class="min-h-0 flex-1 data-[state=inactive]:hidden">
        <EffectsEditor
          :definitions="effectDefinitions"
          :effects="effects"
          @add="project.addEffect"
          @remove="project.removeEffect"
          @toggle="project.toggleEffect"
          @setting="project.setEffectSetting"
          @reorder="project.reorderEffect"
        />
      </TabsContent>
      <TabsContent value="export" class="min-h-0 flex-1 data-[state=inactive]:hidden">
        <ExportEditor
          :device="device"
          :frame-count="frameCount"
          :package-bytes="exportResult?.bytes ?? null"
          :busy="isExporting || isProcessing"
          :error="exportError"
          :archive-url="archiveUrl"
          :lua="exportResult?.lua ?? ''"
          :files="exportFiles"
          :warnings="exportWarnings"
          @generate="project.generateExport"
        />
      </TabsContent>
    </TabsRoot>
  </section>
</template>
