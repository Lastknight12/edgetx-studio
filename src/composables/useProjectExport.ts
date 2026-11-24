import { onBeforeUnmount, ref, shallowRef } from 'vue'
import type { DeviceProfile, EffectInstance } from '@/types/studio'
import {
  buildProjectZip,
  type ExportFrame,
  type ExportResult,
} from '@/modules/export/exportProject'

export function useProjectExport() {
  const isExporting = ref(false)
  const error = ref('')
  const result = shallowRef<ExportResult | null>(null)
  const archiveUrl = ref('')

  function invalidate() {
    if (archiveUrl.value) URL.revokeObjectURL(archiveUrl.value)
    archiveUrl.value = ''
    result.value = null
    error.value = ''
  }

  async function generate(
    frames: ExportFrame[],
    device: DeviceProfile,
    effects: EffectInstance[],
    loop: boolean,
  ) {
    isExporting.value = true
    error.value = ''
    try {
      const output = await buildProjectZip(frames, device, effects, loop)
      invalidate()
      result.value = output
      archiveUrl.value = URL.createObjectURL(output.blob)
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : 'Export failed'
    } finally {
      isExporting.value = false
    }
  }

  onBeforeUnmount(invalidate)

  return { isExporting, error, result, archiveUrl, generate, invalidate }
}
