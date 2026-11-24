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
  for index, position in ipairs(positions) do
    local x, y = position[1], position[2]
    local phase = (time * ${frequency} + (index - 1) * 0.713) % 4
    local closed = phase < ${duration} and math.sin((phase / ${duration}) * math.pi) or 0
    local eyeHeight = math.max(1, math.floor(5 * (1 - closed) + 0.5))
    if eyeHeight == 1 then
      lcd.drawFilledRectangle(x - 4, y, 9, 1)
    else
      lcd.drawFilledRectangle(x - 4, y - math.floor(eyeHeight / 2), 9, eyeHeight, ERASE)
      lcd.drawRectangle(x - 5, y - 2, 10, 5)
      lcd.drawFilledRectangle(x - 1, y - 1, 2, 3)
    end
  end
end
`
  },
}
