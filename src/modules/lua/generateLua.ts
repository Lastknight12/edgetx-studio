import type { DeviceProfile, EffectInstance } from '@/types/studio'
import { getLuaEffectGenerator } from './effects/registry'
import { animationLuaTemplate } from './templates/animation'
import { staticLuaTemplate } from './templates/static'

export function canvasToMonochromePixels(canvas: HTMLCanvasElement): Uint8Array {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D context is unavailable')
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = new Uint8Array(canvas.width * canvas.height)
  for (let pixel = 0; pixel < pixels.length; pixel++) {
    const offset = pixel * 4
    pixels[pixel] = data[offset]! < 128 ? 1 : 0
  }
  return pixels
}

export function generateLua(
  frames: { duration: number }[],
  device: DeviceProfile,
  loop: boolean,
  effects: EffectInstance[],
): string {
  const { effectFunctions, effectCalls } = generateLuaEffectParts(effects, device)

  if (frames.length > 1) {
    return animationLuaTemplate(device, frames, loop, effectFunctions, effectCalls)
  }
  return staticLuaTemplate(device, effectFunctions, effectCalls)
}

export function generateLuaEffectProgram(effects: EffectInstance[], device: DeviceProfile): string {
  const { effectFunctions, effectCalls } = generateLuaEffectParts(effects, device)
  if (!effectFunctions) return ''
  return `${effectFunctions}\nreturn function(time)\n${effectCalls}\nend`
}

function generateLuaEffectParts(effects: EffectInstance[], device: DeviceProfile) {
  const enabledEffects = effects
    .filter((effect) => effect.enabled)
    .sort((left, right) => left.order - right.order)
  const effectFunctions = enabledEffects.length
    ? `${clippedLineFunction(device)}\n${enabledEffects
        .map((effect, index) =>
          getLuaEffectGenerator(effect.type).generate(effect, device, `drawEffect${index + 1}`),
        )
        .join('\n')}`
    : ''
  const effectCalls = enabledEffects.map((_, index) => `  drawEffect${index + 1}(time)`).join('\n')
  return { effectFunctions, effectCalls }
}

function clippedLineFunction(device: DeviceProfile): string {
  return `local randomTicks = getTime()
local randomSeed = (randomTicks % 65521 + math.floor(randomTicks / 65521) * 40503) % 65521

local function random01(item, stream)
  local value = (randomSeed + item * 40503 + stream * 23421 + 7919) % 65521
  value = (value * value + 251 * value + 13849) % 65521
  value = (value * value + 251 * value + 13849) % 65521
  return value / 65521
end

local function drawLine(x1, y1, x2, y2, pattern, flags)
  local dx, dy = x2 - x1, y2 - y1
  local t0, t1 = 0, 1
  local function clip(p, q)
    if p == 0 then return q >= 0 end
    local ratio = q / p
    if p < 0 then
      if ratio > t1 then return false end
      if ratio > t0 then t0 = ratio end
    else
      if ratio < t0 then return false end
      if ratio < t1 then t1 = ratio end
    end
    return true
  end
  if not clip(-dx, x1) or not clip(dx, ${device.width - 1} - x1)
    or not clip(-dy, y1) or not clip(dy, ${device.height - 1} - y1) then return end
  local startX = math.floor(x1 + t0 * dx + 0.5)
  local startY = math.floor(y1 + t0 * dy + 0.5)
  local endX = math.floor(x1 + t1 * dx + 0.5)
  local endY = math.floor(y1 + t1 * dy + 0.5)
  startX = math.max(0, math.min(${device.width - 1}, startX))
  endX = math.max(0, math.min(${device.width - 1}, endX))
  startY = math.max(0, math.min(${device.height - 1}, startY))
  endY = math.max(0, math.min(${device.height - 1}, endY))
  lcd.drawLine(startX, startY, endX, endY, pattern, flags)
end`
}
