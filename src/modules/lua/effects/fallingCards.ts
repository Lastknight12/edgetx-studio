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
  local function drawCardPixel(centerX, centerY, localX, localY, cosAngle, sinAngle)
    local px = centerX + localX * cosAngle - localY * sinAngle
    local py = centerY + localX * sinAngle + localY * cosAngle
    px, py = math.floor(px), math.floor(py)
    drawLine(px, py, px, py, SOLID, 0)
  end
  local function drawGlyph(centerX, centerY, angle, character, offsetX, offsetY)
    local rows
    if character == "A" then rows = {2, 5, 7, 5, 5}
    elseif character == "7" then rows = {7, 1, 2, 2, 2}
    elseif character == "Q" then rows = {2, 5, 5, 7, 3}
    elseif character == "3" then rows = {6, 1, 2, 1, 6}
    elseif character == "S" then rows = {3, 4, 2, 1, 6}
    elseif character == "H" then rows = {5, 5, 7, 5, 5}
    elseif character == "D" then rows = {6, 5, 5, 5, 6}
    elseif character == "C" then rows = {3, 4, 4, 4, 3}
    end
    for row = 1, 5 do
      local mask = rows[row]
      for column = 0, 2 do
        if math.floor(mask / (2 ^ (2 - column))) % 2 == 1 then
          drawCardPixel(centerX, centerY, offsetX + column, offsetY + row - 1, math.cos(angle), math.sin(angle))
        end
      end
    end
  end
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
        local left, right = intersections[1], intersections[1]
        for intersection = 2, #intersections do
          left = math.min(left, intersections[intersection])
          right = math.max(right, intersections[intersection])
        end
        drawLine(math.floor(left), scanY, math.floor(right), scanY, SOLID, ERASE)
      end
    end
    for edge = 1, 4 do
      local nextCorner = edge % 4 + 1
      drawLine(math.floor(xs[edge]), math.floor(ys[edge]), math.floor(xs[nextCorner]), math.floor(ys[nextCorner]), SOLID, 0)
    end
    drawGlyph(x, y, angle, ranks[item % 4 + 1], -4, -6)
    drawGlyph(x, y, angle, suits[item % 4 + 1], 1, 2)
    drawCardPixel(x, y, 0, -1, cosAngle, sinAngle)
    drawCardPixel(x, y, -1, 0, cosAngle, sinAngle)
    drawCardPixel(x, y, 0, 0, cosAngle, sinAngle)
    drawCardPixel(x, y, 1, 0, cosAngle, sinAngle)
    drawCardPixel(x, y, 0, 1, cosAngle, sinAngle)
  end
end
`
  },
}
