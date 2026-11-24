import JSZip from 'jszip'
import type { DeviceProfile, EffectInstance } from '@/types/studio'
import { encodeMonochromeBmp } from '@/modules/image/bmpEncoder'
import { splitPixels } from '@/modules/image/imageProcessing'
import { canvasToMonochromePixels, generateLua } from '@/modules/lua/generateLua'

export interface ExportFrame {
  canvas: HTMLCanvasElement
  luaCanvas?: HTMLCanvasElement
  duration: number
  name: string
}

export interface ExportResult {
  blob: Blob
  lua: string
  bytes: number
  files: { name: string; blob: Blob }[]
  warnings: string[]
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

export async function buildProjectZip(
  frames: ExportFrame[],
  device: DeviceProfile,
  effects: EffectInstance[],
  loop: boolean,
): Promise<ExportResult> {
  if (!frames.length) throw new Error('There are no frames to export')
  const zip = new JSZip()
  const assets = zip.folder('IMAGES')
  if (!assets) throw new Error('Unable to create the image export folder')
  const halfWidth = Math.floor(device.width / 2)
  const files: { name: string; blob: Blob }[] = []

  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index]!
    if (frame.canvas.width !== device.width || frame.canvas.height !== device.height) {
      throw new Error(`Frame ${index + 1} dimensions do not match the selected device`)
    }
    const luaCanvas = frame.luaCanvas ?? frame.canvas
    if (luaCanvas.width !== device.width || luaCanvas.height !== device.height) {
      throw new Error(`Lua frame ${index + 1} dimensions do not match the selected device`)
    }
    const pixels = canvasToMonochromePixels(luaCanvas)
    const [left, right] = splitPixels(pixels, device)
    const rightWidth = device.width - halfWidth
    const prefix = frames.length > 1 ? `FRAMES/${String(index + 1).padStart(3, '0')}` : 'image'
    const leftName = `${prefix}_left.bmp`
    const rightName = `${prefix}_right.bmp`
    const leftBlob = encodeMonochromeBmp(left, halfWidth, device.height)
    const rightBlob = encodeMonochromeBmp(right, rightWidth, device.height)
    assets.file(leftName, leftBlob)
    assets.file(rightName, rightBlob)
    files.push(
      { name: `IMAGES/${leftName}`, blob: leftBlob },
      { name: `IMAGES/${rightName}`, blob: rightBlob },
    )
    if (index % 4 === 3) await yieldToBrowser()
  }

  const lua = generateLua(frames, device, loop, effects)
  const luaPath = 'SCRIPTS/TELEMETRY/studio.lua'
  zip.file(luaPath, lua)
  files.push({ name: luaPath, blob: new Blob([lua], { type: 'text/plain' }) })
  zip.file(
    'project.json',
    JSON.stringify(
      {
        format: 'edgetx-studio-project',
        version: 1,
        device: { id: device.id, name: device.name, width: device.width, height: device.height },
        frameCount: frames.length,
        frameNames: frames.map(({ name }) => name),
        effects: effects.map(({ type, enabled, settings }) => ({ type, enabled, settings })),
        hardwareNote:
          'The Lua telemetry script draws split monochrome BMP files from the SD card with lcd.drawPixmap, so animation pixels are not embedded in Lua memory. Enabled effects are generated only when present. Install the archive contents on the SD card and assign /SCRIPTS/TELEMETRY/studio.lua; verify on your firmware.',
      },
      null,
      2,
    ),
  )

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  const warnings = [
    'Inspect script size and test animation timing and LCD draw performance on-device before use.',
  ]
  return { blob, lua, bytes: blob.size, files, warnings }
}
