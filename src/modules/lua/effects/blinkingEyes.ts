import type { LuaEffectGenerator } from './types'
import { numberSetting } from './types'

export const blinkingEyesLua: LuaEffectGenerator = {
  type: 'blinking-eyes',
  generate(effect, device, functionName) {
    const count = Math.round(numberSetting(effect, 'count', 3))
    const frequency = numberSetting(effect, 'frequency', 1.2)
    const duration = numberSetting(effect, 'duration', 0.2)
    const positions = [
      [0.2, 0.34],
      [0.5, 0.28],
      [0.78, 0.38],
      [0.34, 0.72],
      [0.68, 0.7],
      [0.12, 0.78],
      [0.87, 0.2],
      [0.52, 0.83],
    ]
    const selected = positions
      .slice(0, count)
      .map(([x, y]) => `{${Math.round(x! * device.width)},${Math.round(y! * device.height)}}`)
      .join(',')
    const fn = functionName
    return `local function ${fn}(time)
  local positions = {${selected}}
  local function drawOval(cx, cy, halfWidth, halfHeight, flags)
    for row = -halfHeight, halfHeight do
      local vertical = row / halfHeight
      local rowWidth = math.floor(halfWidth * math.sqrt(1 - vertical * vertical))
      drawLine(cx - rowWidth, cy + row, cx + rowWidth, cy + row, SOLID, flags)
    end
  end
  for index, position in ipairs(positions) do
    local item = index
    local x = math.floor(position[1] + (random01(item, 51) * 2 - 1) * ${device.width * 0.035} + 0.5)
    local y = math.floor(position[2] + (random01(item, 52) * 2 - 1) * ${device.height * 0.035} + 0.5)
    x = math.max(8, math.min(${device.width - 8}, x))
    y = math.max(5, math.min(${device.height - 5}, y))
    local phase = (time * ${frequency} * (0.75 + random01(item, 53) * 0.5) + random01(item, 54) * 4) % 4
    local closed = phase < ${duration} and math.sin((phase / ${duration}) * math.pi) or 0
    local eyeHeight = math.floor(4 * (1 - closed) + 0.5)
    if eyeHeight <= 1 then
      drawLine(x - 6, y, x + 6, y, SOLID, 0)
    else
      drawOval(x, y, 7, eyeHeight, 0)
      drawOval(x, y, 6, eyeHeight - 1, ERASE)
      local pupilX = x + (index % 2 == 1 and -1 or 1)
      drawOval(pupilX, y, 1, 2, 0)
      drawLine(pupilX - 1, y - 1, pupilX - 1, y - 1, SOLID, ERASE)
    end
  end
end
`
  },
}
