import type { LuaEffectGenerator } from './types'
import { numberSetting } from './types'

export const fallingSnowLua: LuaEffectGenerator = {
  type: 'falling-snow',
  generate(effect, device, functionName) {
    const count = Math.round(numberSetting(effect, 'count', 20))
    const speed = numberSetting(effect, 'speed', 0.8)
    const wind = numberSetting(effect, 'wind', 0.2)
    const size = Math.round(numberSetting(effect, 'size', 2))
    return `local function ${functionName}(time)
  local cycle = ${device.height + 6}
  for index = 1, ${count} do
    local item = index - 1
    local seed = item + 1
    local phase = (time * ${speed} * (2.5 + random01(seed, 21) * 6) + random01(seed, 22) * cycle) % cycle
    local y = phase - 3
    local baseX = random01(seed, 23) * ${device.width}
    local drift = baseX + time * ${wind} * (2 + random01(seed, 24) * 6) + math.sin(time * (0.35 + random01(seed, 25)) + random01(seed, 26) * 6.283) * (1 + random01(seed, 27) * 4)
    local x = ((drift % ${device.width}) + ${device.width}) % ${device.width}
    if ${size} == 1 then
      drawLine(math.floor(x), math.floor(y), math.floor(x), math.floor(y), SOLID, 0)
    else
      drawLine(math.floor(x - ${size}), math.floor(y), math.floor(x + ${size}), math.floor(y), SOLID, 0)
      drawLine(math.floor(x), math.floor(y - ${size}), math.floor(x), math.floor(y + ${size}), SOLID, 0)
${
  size >= 3
    ? `      drawLine(math.floor(x - 1), math.floor(y - 1), math.floor(x - 2), math.floor(y - 2), SOLID, 0)
      drawLine(math.floor(x + 1), math.floor(y - 1), math.floor(x + 2), math.floor(y - 2), SOLID, 0)
      drawLine(math.floor(x - 1), math.floor(y + 1), math.floor(x - 2), math.floor(y + 2), SOLID, 0)
      drawLine(math.floor(x + 1), math.floor(y + 1), math.floor(x + 2), math.floor(y + 2), SOLID, 0)
`
    : ''
}    end
  end
end
`
  },
}
