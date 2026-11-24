import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { isGifFile } from '@/modules/image/gifImport'

export function useGlobalImageDrop(
  activeTab: Ref<string>,
  uploadImage: (files: FileList | File[]) => void | Promise<void>,
  uploadFrames: (files: FileList | File[]) => void | Promise<void>,
) {
  const isDraggingFiles = ref(false)
  let dragDepth = 0

  function containsFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
  }

  function onDragEnter(event: DragEvent) {
    if (!containsFiles(event)) return
    event.preventDefault()
    dragDepth += 1
    isDraggingFiles.value = true
  }

  function onDragOver(event: DragEvent) {
    if (!containsFiles(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  function onDragLeave(event: DragEvent) {
    if (!containsFiles(event)) return
    dragDepth = Math.max(0, dragDepth - 1)
    if (!dragDepth) isDraggingFiles.value = false
  }

  function onDrop(event: DragEvent) {
    if (!containsFiles(event)) return
    event.preventDefault()
    dragDepth = 0
    isDraggingFiles.value = false

    if (event.target instanceof Element && event.target.closest('[data-file-drop-zone]')) return

    const files = event.dataTransfer?.files
    if (!files?.length) return
    if (files.length > 1 || activeTab.value === 'animation' || isGifFile(files[0]!)) {
      void uploadFrames(files)
    } else {
      void uploadImage(files)
    }
  }

  function reset() {
    dragDepth = 0
    isDraggingFiles.value = false
  }

  onMounted(() => {
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragend', reset)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('dragenter', onDragEnter)
    window.removeEventListener('dragover', onDragOver)
    window.removeEventListener('dragleave', onDragLeave)
    window.removeEventListener('drop', onDrop)
    window.removeEventListener('dragend', reset)
  })

  return { isDraggingFiles }
}
