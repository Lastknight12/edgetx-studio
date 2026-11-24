import type { LuaEffectGenerator } from './types'
import { numberSetting } from './types'

export const firefliesLua: LuaEffectGenerator = {
  type: 'fireflies',
  generate(effect, device, functionName) {
    const count = Math.round(numberSetting(effect, 'count', 7))
    const speed = numberSetting(effect, 'speed', 1)
    const size = Math.round(numberSetting(effect, 'size', 2))
    return `local function ${functionName}(time)
  for index = 1, ${count} do
    local item = index - 1
    local seed = item + 1
    local xBase = 3 + random01(seed, 31) * math.max(1, ${device.width} - 6)
    local yBase = 3 + random01(seed, 32) * math.max(1, ${device.height} - 6)
    local x = math.floor(xBase + math.sin(time * ${speed} * (0.25 + random01(seed, 33) * 0.6) + random01(seed, 34) * 6.283) * (1 + random01(seed, 35) * 4))
    local y = math.floor(yBase + math.cos(time * ${speed} * (0.3 + random01(seed, 36) * 0.7) + random01(seed, 37) * 6.283) * (1 + random01(seed, 38) * 3))
    local pulse = math.sin(time * ${speed} * (1.1 + random01(seed, 39) * 2.2) + random01(seed, 40) * 6.283)
    if pulse > -0.65 then
      drawLine(x, y, x, y, SOLID, 0)
    end
    if pulse > 0.15 then
      local radius = ${size} + (pulse > 0.8 and 1 or 0)
      drawLine(x - radius, y, x + radius, y, SOLID, 0)
      drawLine(x, y - radius, x, y + radius, SOLID, 0)
      if pulse > 0.8 then
        drawLine(x - 1, y - 1, x + 1, y + 1, SOLID, 0)
        drawLine(x - 1, y + 1, x + 1, y - 1, SOLID, 0)
      end
    end
  end
end
`
  },
}
