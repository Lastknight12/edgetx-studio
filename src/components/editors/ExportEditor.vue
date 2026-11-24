<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import {
  Check,
  Code2,
  Download,
  FileArchive,
  FileImage,
  FolderPlus,
  FolderSearch,
  LoaderCircle,
  Radio,
  Upload,
} from '@lucide/vue'
import type { DeviceProfile } from '@/types/studio'
import {
  chooseSdCardRoot,
  createImageFolder,
  FolderAccessError,
  findImageFolders,
  findScriptFolders,
  luaForImageFolder,
  uploadExportToSdCard,
  type ImageFolderChoice,
  type ScriptFolderChoice,
} from '@/modules/export/sdCardUpload'
import UiButton from '@/components/ui/UiButton.vue'
import UiIconButton from '@/components/ui/UiIconButton.vue'

interface ExportAsset {
  name: string
  blob: Blob
}

const props = defineProps<{
  device: DeviceProfile
  frameCount: number
  packageBytes: number | null
  busy: boolean
  error: string
  archiveUrl: string
  lua: string
  files: ExportAsset[]
  warnings: string[]
}>()
const emit = defineEmits<{ generate: [] }>()
const totalBytes = computed(
  () => props.packageBytes ?? props.files.reduce((sum, file) => sum + file.blob.size, 0),
)
const sdCardRoot = shallowRef<FileSystemDirectoryHandle | null>(null)
const imageFolders = shallowRef<ImageFolderChoice[]>([])
const scriptFolders = shallowRef<ScriptFolderChoice[]>([])
const selectedImageFolderPath = ref('')
const newImageFolderName = ref('')
const selectedScriptFolderPath = ref('SCRIPTS/TELEMETRY')
const isUploading = ref(false)
const uploadError = ref('')
const openInNewTab = ref(false)
const uploadProgress = ref('')
const uploadComplete = ref(false)
const selectedImageFolder = computed(
  () => imageFolders.value.find(({ path }) => path === selectedImageFolderPath.value) ?? null,
)
const selectedScriptFolder = computed(
  () => scriptFolders.value.find(({ path }) => path === selectedScriptFolderPath.value) ?? null,
)
const previewLua = computed(() =>
  selectedImageFolder.value
    ? luaForImageFolder(props.lua, selectedImageFolder.value.path, props.frameCount > 1)
    : props.lua,
)

async function detectSdCardFolders() {
  uploadError.value = ''
  openInNewTab.value = false
  uploadComplete.value = false
  try {
    const root = await chooseSdCardRoot()
    const [folders, scriptDestinations] = await Promise.all([
      findImageFolders(root),
      findScriptFolders(root),
    ])
    sdCardRoot.value = root
    imageFolders.value = folders
    scriptFolders.value = scriptDestinations
    const defaultPath = props.frameCount > 1 ? 'IMAGES/FRAMES' : 'IMAGES'
    selectedImageFolderPath.value = folders.some(({ path }) => path === defaultPath)
      ? defaultPath
      : 'IMAGES'
    selectedScriptFolderPath.value = scriptDestinations.some(
      ({ path }) => path === 'SCRIPTS/TELEMETRY',
    )
      ? 'SCRIPTS/TELEMETRY'
      : (scriptDestinations[0]?.path ?? 'SCRIPTS/TELEMETRY')
  } catch (reason) {
    openInNewTab.value = reason instanceof FolderAccessError && reason.reason === 'embedded-preview'
    uploadError.value =
      reason instanceof Error ? reason.message : 'Unable to read the selected folder.'
  }
}

async function uploadToSdCard() {
  if (
    !sdCardRoot.value ||
    !selectedImageFolder.value ||
    !selectedScriptFolder.value ||
    !props.files.length
  )
    return
  isUploading.value = true
  uploadError.value = ''
  uploadComplete.value = false
  try {
    await uploadExportToSdCard(
      selectedImageFolder.value,
      selectedScriptFolder.value,
      { files: props.files, lua: props.lua },
      props.frameCount > 1,
      (completed, total, fileName) => {
        uploadProgress.value = `${completed} / ${total}: ${fileName}`
      },
    )
    uploadComplete.value = true
    uploadProgress.value = `${props.files.length} files copied.`
  } catch (reason) {
    uploadError.value =
      reason instanceof Error ? reason.message : 'Unable to write files to the SD card.'
  } finally {
    isUploading.value = false
  }
}

async function createNewImageFolder() {
  if (!selectedImageFolder.value) return
  uploadError.value = ''
  try {
    const created = await createImageFolder(selectedImageFolder.value, newImageFolderName.value)
    const existing = imageFolders.value.find(({ path }) => path === created.path)
    if (!existing) {
      imageFolders.value = [...imageFolders.value, created].sort((left, right) =>
        left.path.localeCompare(right.path),
      )
    }
    selectedImageFolderPath.value = created.path
    newImageFolderName.value = ''
    uploadComplete.value = false
    uploadProgress.value = ''
  } catch (reason) {
    uploadError.value =
      reason instanceof Error ? reason.message : 'Unable to create the image folder.'
  }
}

function fileBlob(file: ExportAsset): Blob {
  if (file.name.toLowerCase().endsWith('studio.lua') && selectedImageFolder.value) {
    return new Blob([previewLua.value], { type: 'text/plain' })
  }
  return file.blob
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}
</script>

<template>
  <div class="h-full min-h-0 overflow-y-auto p-4 sm:p-5">
    <div>
      <h3 class="mb-0 mt-1 text-sm font-medium tracking-tight text-zinc-200">Export project</h3>
      <p class="mt-1 text-[10px] text-zinc-500">
        Package split monochrome assets and an EdgeTX telemetry screen script.
      </p>
    </div>

    <div class="mt-5 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/10 p-3">
      <div
        class="grid size-9 shrink-0 place-items-center rounded-md border border-violet-300/10 bg-violet-300/[0.06] text-violet-200"
      >
        <Radio :size="17" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium text-zinc-200">{{ device.name }}</p>
        <p class="mt-1 text-[10px] text-zinc-500">
          {{ device.width }} × {{ device.height }} · 1-bit monochrome
        </p>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <div
        v-for="stat in [
          { label: 'OUTPUT TYPE', value: frameCount > 1 ? 'ANIMATION' : 'STATIC IMAGE' },
          { label: 'FRAME COUNT', value: String(frameCount) },
          { label: 'BMP FORMAT', value: '1-bit · split L / R' },
          { label: 'PACKAGE SIZE', value: packageBytes === null ? '—' : formatBytes(totalBytes) },
        ]"
        :key="stat.label"
        class="flex min-w-0 flex-col gap-1.5 rounded-md border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
      >
        <span class="text-[8px] tracking-[0.11em] text-zinc-600">{{ stat.label }}</span>
        <strong class="truncate text-[10px] font-medium text-zinc-300">{{ stat.value }}</strong>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <UiButton class="flex-1" variant="primary" :disabled="busy" @click="emit('generate')">
        <LoaderCircle v-if="busy" class="animate-spin" :size="14" />
        <FileArchive v-else :size="14" />
        {{ busy ? 'Building…' : archiveUrl ? 'Rebuild ZIP' : 'Build ZIP archive' }}
      </UiButton>
      <a
        v-if="archiveUrl"
        class="inline-flex min-h-9 items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.035] px-3 text-xs text-zinc-300 transition-colors hover:bg-white/[0.075]"
        :href="archiveUrl"
        download="edgetx-studio-project.zip"
        ><Download :size="14" /> ZIP</a
      >
    </div>
    <p
      v-if="error"
      class="mt-3 rounded-md border border-red-300/15 bg-red-300/[0.06] px-3 py-2 text-xs text-red-200"
    >
      {{ error }}
    </p>

    <section v-if="files.length" class="mt-5 rounded-lg border border-white/[0.07] bg-black/10 p-3">
      <p class="m-0 text-[9px] font-semibold tracking-[0.12em] text-zinc-500">UPLOAD TO SD CARD</p>
      <p class="mt-1 text-[10px] leading-relaxed text-zinc-500">
        Select the SD card root, then choose separate destinations for image files and the Lua
        script.
      </p>
      <UiButton class="mt-3 w-full" :disabled="isUploading" @click="detectSdCardFolders">
        <FolderSearch :size="14" />{{
          sdCardRoot ? 'Detect folders again' : 'Detect SD card folders'
        }}
      </UiButton>
      <label v-if="imageFolders.length" class="mt-3 block">
        <span class="mb-1 block text-[10px] text-zinc-400">Image destination folder</span>
        <select
          v-model="selectedImageFolderPath"
          class="min-h-9 w-full rounded-md border border-white/[0.09] bg-[#0c0d10] px-2 text-xs text-zinc-200 outline-none focus:border-violet-300/40"
          :disabled="isUploading"
          @change="uploadComplete = false"
        >
          <option v-for="folder in imageFolders" :key="folder.path" :value="folder.path">
            /{{ folder.path }}
          </option>
        </select>
      </label>
      <div v-if="selectedImageFolder" class="mt-2 flex items-center gap-2">
        <input
          v-model="newImageFolderName"
          class="min-h-8 min-w-0 flex-1 rounded-md border border-white/[0.09] bg-[#0c0d10] px-2 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-300/40"
          type="text"
          maxlength="64"
          placeholder="New folder name"
          aria-label="New image folder name"
          :disabled="isUploading"
          @keydown.enter.prevent="createNewImageFolder"
        />
        <UiButton
          size="small"
          :disabled="isUploading || !newImageFolderName.trim()"
          @click="createNewImageFolder"
        >
          <FolderPlus :size="13" />Create
        </UiButton>
      </div>
      <p v-if="selectedImageFolder" class="mt-1 text-[9px] text-zinc-600">
        New folder is created inside the selected folder and named in uppercase.
      </p>
      <p v-if="selectedImageFolder" class="mt-2 break-all text-[9px] text-zinc-600">
        Lua image path: /{{ selectedImageFolder.path }}
      </p>
      <label v-if="scriptFolders.length" class="mt-3 block">
        <span class="mb-1 block text-[10px] text-zinc-400">Lua script destination folder</span>
        <select
          v-model="selectedScriptFolderPath"
          class="min-h-9 w-full rounded-md border border-white/[0.09] bg-[#0c0d10] px-2 text-xs text-zinc-200 outline-none focus:border-violet-300/40"
          :disabled="isUploading"
          @change="uploadComplete = false"
        >
          <option v-for="folder in scriptFolders" :key="folder.path" :value="folder.path">
            /{{ folder.path }}
          </option>
        </select>
      </label>
      <UiButton
        v-if="imageFolders.length && scriptFolders.length"
        class="mt-3 w-full"
        variant="primary"
        :disabled="isUploading || !selectedImageFolder || !selectedScriptFolder"
        @click="uploadToSdCard"
      >
        <LoaderCircle v-if="isUploading" class="animate-spin" :size="14" />
        <Upload v-else :size="14" />
        {{ isUploading ? 'Uploading files…' : 'Upload files' }}
      </UiButton>
      <p v-if="uploadProgress" class="mt-2 text-[10px] text-zinc-500" aria-live="polite">
        {{ uploadProgress }}
      </p>
      <p
        v-if="uploadError"
        class="mt-3 rounded-md border border-red-300/15 bg-red-300/[0.06] px-3 py-2 text-xs text-red-200"
        role="alert"
      >
        {{ uploadError }}
      </p>
      <div
        v-if="uploadComplete"
        class="mt-3 rounded-md border border-emerald-300/10 bg-emerald-300/[0.04] p-3"
      >
        <p class="m-0 flex items-start gap-2 text-[10px] leading-relaxed text-emerald-100/80">
          <Check :size="14" class="mt-0.5 shrink-0" />
          <span>
            Upload complete. Images: /{{ selectedImageFolder?.path }}; script: /{{
              selectedScriptFolder?.path
            }}/studio.lua.
          </span>
        </p>
      </div>
    </section>

    <div
      class="mb-2 mt-6 flex items-center justify-between text-[9px] font-semibold tracking-[0.14em] text-zinc-500"
    >
      <span>GENERATED FILES</span><span>{{ files.length }}</span>
    </div>
    <div v-if="files.length" class="space-y-1">
      <div
        v-for="file in files"
        :key="file.name"
        class="flex items-center gap-2 rounded-md border border-white/[0.05] px-2 py-1.5 text-[10px] text-zinc-400"
      >
        <FileImage v-if="file.name.endsWith('.bmp')" :size="14" class="shrink-0 text-zinc-500" />
        <Code2 v-else :size="14" class="shrink-0 text-zinc-500" />
        <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
        <span class="shrink-0 text-[9px] text-zinc-600">{{
          formatBytes(fileBlob(file).size)
        }}</span>
        <UiIconButton
          :label="`Download ${file.name}`"
          @click="download(fileBlob(file), file.name.split('/').pop() ?? file.name)"
          ><Download :size="12"
        /></UiIconButton>
      </div>
    </div>
    <div
      v-else
      class="flex flex-col items-center rounded-lg border border-dashed border-white/[0.07] px-5 py-6 text-center"
    >
      <FileArchive :size="20" class="text-zinc-600" />
      <p class="mb-0 mt-2 text-xs text-zinc-400">Output is not built</p>
      <span class="mt-1 text-[10px] text-zinc-600"
        >Generate the archive to inspect and download project files.</span
      >
    </div>

    <div class="mb-2 mt-6 text-[9px] font-semibold tracking-[0.14em] text-zinc-500">
      <span>LUA PREVIEW</span>
    </div>
    <pre
      class="max-h-56 overflow-auto rounded-lg border border-white/6 bg-[#090a0d] p-3 text-[10px] leading-relaxed text-zinc-400"
    ><code>{{ previewLua || '-- Build the project to generate Lua output.' }}</code></pre>
    <div v-if="warnings.length" class="mt-3 space-y-2"></div>
    <div
      v-else-if="lua"
      class="mt-3 flex items-center gap-2 rounded-md border border-emerald-300/10 bg-emerald-300/[0.04] px-3 py-2 text-[10px] text-emerald-100/70"
    >
      <Check :size="13" />Lua renderer uses documented EdgeTX B&amp;W LCD drawing calls.
    </div>
  </div>
</template>
