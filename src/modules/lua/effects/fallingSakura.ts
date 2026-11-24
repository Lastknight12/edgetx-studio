import type { LuaEffectGenerator } from './types'
import { numberSetting } from './types'

export const fallingSakuraLua: LuaEffectGenerator = {
  type: 'falling-sakura',
  generate(effect, device, functionName) {
    const count = Math.round(numberSetting(effect, 'count', 10))
    const speed = numberSetting(effect, 'speed', 0.8)
    const wind = numberSetting(effect, 'wind', 0.2)
    const size = numberSetting(effect, 'size', 2)
    const randomness = numberSetting(effect, 'randomness', 0.6)
    const fn = functionName
    return `local function ${fn}(time)
  local cycle = ${device.height + 12}
  for index = 1, ${count} do
    local seed = (index - 1) * 37.17
    local variation = 0.55 + (((index - 1) % 5) / 5) * ${randomness}
    local phase = (time * ${speed} * variation + seed) % cycle
    local sway = math.sin(time * 1.8 + seed) * 3
    local x = ((seed * 1.73 + phase * ${wind} + sway) % (${device.width} + 8) + ${device.width} + 8) % (${device.width} + 8) - 4
    local y = phase - 6
    local radius = math.max(2, math.floor(${size} * (0.85 + ((index - 1) % 3) * 0.22) + 0.5))
    local angle = math.sin(time * 2 + seed) * 0.8
    local cosAngle, sinAngle = math.cos(angle), math.sin(angle)
    for row = -radius, radius do
      local halfWidth = radius * 0.75 * (1 - math.abs(row) / (radius + 1))
      local x1 = x - halfWidth * cosAngle - row * sinAngle
      local y1 = y - halfWidth * sinAngle + row * cosAngle
      local x2 = x + halfWidth * cosAngle - row * sinAngle
      local y2 = y + halfWidth * sinAngle + row * cosAngle
      lcd.drawLine(math.floor(x1), math.floor(y1), math.floor(x2), math.floor(y2), SOLID, 0)
    end
    local veinX1 = x + radius * sinAngle
    local veinY1 = y - radius * cosAngle
    local veinX2 = x - radius * sinAngle
    local veinY2 = y + radius * cosAngle
    lcd.drawLine(math.floor(veinX1), math.floor(veinY1), math.floor(veinX2), math.floor(veinY2), SOLID, ERASE)
  end
end
`
  },
}
