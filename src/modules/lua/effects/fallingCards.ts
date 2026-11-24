import type { LuaEffectGenerator } from './types'
import { numberSetting } from './types'

export const fallingCardsLua: LuaEffectGenerator = {
  type: 'falling-cards',
  generate(effect, device, functionName) {
    const count = Math.round(numberSetting(effect, 'count', 4))
    const speed = numberSetting(effect, 'speed', 0.7)
    const size = numberSetting(effect, 'size', 0.8)
    return `local function ${functionName}(time)
  local cardWidth = math.max(7, math.floor(15 * ${size} + 0.5))
  local cardHeight = math.max(9, math.floor(21 * ${size} + 0.5))
  local cycle = ${device.height} + cardHeight + 8
  local ranks = {"A", "7", "Q", "3"}
  local suits = {"S", "H", "D", "C"}
  for index = 1, ${count} do
    local item = index - 1
    local seed = item * 29.41
    local x = 5 + (seed * 1.91) % math.max(1, ${device.width} - 10)
    local y = (time * ${speed} * (7 + (item % 3) * 3) + seed * 5) % cycle - cardHeight
    local angle = math.sin(time * (0.8 + item * 0.13) + seed) * 0.7
    local halfWidth, halfHeight = cardWidth * 0.5, cardHeight * 0.5
    local cosAngle, sinAngle = math.cos(angle), math.sin(angle)
    local function point(px, py)
      return x + px * cosAngle - py * sinAngle, y + px * sinAngle + py * cosAngle
    end
    local xs, ys = {}, {}
    xs[1], ys[1] = point(-halfWidth, -halfHeight)
    xs[2], ys[2] = point(halfWidth, -halfHeight)
    xs[3], ys[3] = point(halfWidth, halfHeight)
    xs[4], ys[4] = point(-halfWidth, halfHeight)
    local top, bottom = ys[1], ys[1]
    for corner = 2, 4 do
      top = math.min(top, ys[corner])
      bottom = math.max(bottom, ys[corner])
    end
    for scanY = math.floor(top), math.floor(bottom) do
      local intersections = {}
      for edge = 1, 4 do
        local nextCorner = edge % 4 + 1
        local x1, y1 = xs[edge], ys[edge]
        local x2, y2 = xs[nextCorner], ys[nextCorner]
        if (y1 <= scanY and y2 > scanY) or (y2 <= scanY and y1 > scanY) then
          intersections[#intersections + 1] = x1 + (scanY - y1) * (x2 - x1) / (y2 - y1)
        end
      end
      if #intersections >= 2 then
        table.sort(intersections)
        lcd.drawLine(math.floor(intersections[1]), scanY, math.floor(intersections[#intersections]), scanY, SOLID, ERASE)
      end
    end
    for edge = 1, 4 do
      local nextCorner = edge % 4 + 1
      lcd.drawLine(math.floor(xs[edge]), math.floor(ys[edge]), math.floor(xs[nextCorner]), math.floor(ys[nextCorner]), SOLID, 0)
    end
    lcd.drawText(math.floor(x - 2), math.floor(y - 4), ranks[item % 4 + 1], SMLSIZE)
    lcd.drawText(math.floor(x - 2), math.floor(y + 1), suits[item % 4 + 1], SMLSIZE)
  end
end
`
  },
}
