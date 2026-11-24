<script setup lang="ts">
import { Download, TriangleAlert, UploadCloud } from '@lucide/vue'
import DisplayPreview from '@/components/DisplayPreview.vue'
import StudioEditorPanel from '@/components/layout/StudioEditorPanel.vue'
import StudioHeader from '@/components/layout/StudioHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useGlobalImageDrop } from '@/composables/useGlobalImageDrop'
import { useStudioProject } from '@/composables/useStudioProject'

const project = useStudioProject()
const {
  activeTab,
  deviceId,
  device,
  devices,
  isProcessing,
  uploadProgress,
  isExporting,
  previewImage,
  previewVersion,
  isPlaying,
  imageError,
  frames,
  setActiveTab,
  updateDevice,
  generateExport,
} = project
const { isDraggingFiles } = useGlobalImageDrop(
  activeTab,
  project.uploadStatic,
  project.uploadFrames,
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#090a0d] text-zinc-200">
    <StudioHeader :device-id="deviceId" :devices="devices" @update:device-id="updateDevice" />

    <main
      class="mx-auto flex min-h-0 w-full max-w-[1512px] flex-1 flex-col px-4 pb-4 pt-6 sm:px-6 lg:px-8"
    >
      <div class="mb-5 flex items-center justify-end gap-4">
        <UiButton variant="primary" :disabled="isExporting || isProcessing" @click="generateExport">
          <Download :size="14" />
          <span class="hidden sm:inline">Export project</span>
          <span class="sm:hidden">Export</span>
        </UiButton>
      </div>
      <p
        v-if="imageError"
        class="mb-4 flex items-start gap-2 rounded-md border border-red-300/15 bg-red-300/[0.06] px-3 py-2 text-xs text-red-200"
        role="alert"
      >
        <TriangleAlert :size="14" class="mt-0.5 shrink-0" />{{ imageError }}
      </p>

      <div
        class="grid min-h-[680px] flex-1 grid-cols-1 gap-4 lg:min-h-[min(760px,calc(100vh-176px))] lg:grid-cols-[minmax(0,1.12fr)_minmax(410px,0.88fr)]"
      >
        <DisplayPreview
          :device="device"
          :image="previewImage"
          :image-version="previewVersion"
          :playing="isPlaying"
          :can-play="frames.length > 0"
          @toggle-playback="project.togglePlayback"
        />
        <StudioEditorPanel
          :project="project"
          :active-tab="activeTab"
          @update:active-tab="setActiveTab"
        />
      </div>
    </main>
    <div
      v-if="isDraggingFiles"
      class="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-[#090a0d]/75 p-6 backdrop-blur-sm"
      aria-live="polite"
    >
      <div
        class="flex max-w-sm flex-col items-center rounded-xl border border-violet-300/30 bg-[#14151a] px-8 py-7 text-center shadow-2xl"
      >
        <span
          class="grid size-12 place-items-center rounded-lg border border-violet-300/20 bg-violet-300/10 text-violet-200"
        >
          <UploadCloud :size="22" />
        </span>
        <p class="mb-0 mt-4 text-sm font-medium text-zinc-100">Drop image files to import</p>
        <p class="mb-0 mt-1 text-xs text-zinc-500">
          One image opens in Image; multiple images add animation frames.
        </p>
      </div>
    </div>
    <div
      v-if="uploadProgress"
      class="fixed bottom-5 left-1/2 z-[90] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-violet-300/20 bg-[#14151a]/95 px-4 py-3 shadow-2xl backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div class="mb-2 flex items-center justify-between gap-3 text-xs">
        <span class="truncate text-zinc-200">{{ uploadProgress.message }}</span>
        <span class="shrink-0 tabular-nums text-zinc-400"
          >{{ uploadProgress.completed }} / {{ uploadProgress.total }}</span
        >
      </div>
      <div
        class="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        :aria-valuenow="Math.round((uploadProgress.completed / uploadProgress.total) * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="uploadProgress.message"
      >
        <div
          class="h-full rounded-full bg-violet-300 transition-[width] duration-150"
          :style="{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
