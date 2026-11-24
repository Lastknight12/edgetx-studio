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
  local length = math.max(5, math.floor(${size} * 2.1 + 0.5))
  local leafWidth = math.max(2, math.floor(${size} * 1.05 + 0.5))
  local points = {
    { -0.18 * length, 0 },
    { 0.08 * length, -0.34 * leafWidth },
    { 0.42 * length, -leafWidth },
    { 0.78 * length, -0.82 * leafWidth },
    { length, 0 },
    { 0.76 * length, 0.74 * leafWidth },
    { 0.38 * length, 0.92 * leafWidth },
    { 0.06 * length, 0.28 * leafWidth },
    { -0.18 * length, 0 }
  }
  local xs, ys = {}, {}
  for index = 1, ${count} do
    local item = index - 1
    local startX = random01(item + 1, 11) * (${device.width} + 8)
    local startY = random01(item + 1, 12) * cycle
    local variation = 1 + (random01(item + 1, 13) * 2 - 1) * ${randomness}
    local phase = (time * ${speed} * variation + startY) % cycle
    local swaySize = 1 + random01(item + 1, 14) * 4
    local sway = math.sin(time * (1.1 + random01(item + 1, 15)) + random01(item + 1, 16) * 6.283) * swaySize
    local drift = (random01(item + 1, 17) * 2 - 1) * ${wind} * phase
    local x = ((startX + drift + sway) % (${device.width} + 8) + ${device.width} + 8) % (${device.width} + 8) - 4
    local y = phase - 6
    local mirror = random01(item + 1, 18) < 0.5 and -1 or 1
    local rotation = math.sin(time * (0.7 + random01(item + 1, 19)) + random01(item + 1, 20) * 6.283) * 0.7 + 0.45 * mirror
    local cosAngle, sinAngle = math.cos(rotation), math.sin(rotation)
    for pointIndex = 1, #points do
      local localX, localY = points[pointIndex][1], points[pointIndex][2]
      local pointX = math.floor(x + localX * cosAngle - localY * sinAngle)
      local pointY = math.floor(y + localX * sinAngle + localY * cosAngle)
      xs[pointIndex], ys[pointIndex] = pointX, pointY
    end
    local top, bottom = ys[1], ys[1]
    for pointIndex = 2, #ys do
      top = math.min(top, ys[pointIndex])
      bottom = math.max(bottom, ys[pointIndex])
    end
    for scanY = top, bottom do
      local left, right = nil, nil
      for edge = 1, #xs - 1 do
        local x1, y1 = xs[edge], ys[edge]
        local x2, y2 = xs[edge + 1], ys[edge + 1]
        if (y1 <= scanY and y2 > scanY) or (y2 <= scanY and y1 > scanY) then
          local crossing = x1 + (scanY - y1) * (x2 - x1) / (y2 - y1)
          left = left and math.min(left, crossing) or crossing
          right = right and math.max(right, crossing) or crossing
        end
      end
      if left and right and scanY >= 0 and scanY < ${device.height} then
        left = math.max(0, math.floor(left))
        right = math.min(${device.width - 1}, math.floor(right))
        if left <= right then drawLine(left, scanY, right, scanY, SOLID, 0) end
      end
    end
  end
end
`
  },
}
