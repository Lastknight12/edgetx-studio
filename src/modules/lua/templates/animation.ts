import type { DeviceProfile } from '@/types/studio'

export function animationLuaTemplate(
  device: DeviceProfile,
  frames: { duration: number }[],
  loop: boolean,
  effectFunctions: string,
  effectCalls: string,
): string {
  const rightX = Math.floor(device.width / 2)
  let cumulativeDuration = 0
  const frameData = frames
    .map(({ duration }, index) => {
      const safeDuration = Math.max(1, Math.round(duration))
      cumulativeDuration += safeDuration
      const number = String(index + 1).padStart(3, '0')
      return `  { framesFolder .. "/${number}_left.bmp", framesFolder .. "/${number}_right.bmp", ${safeDuration}, ${cumulativeDuration} }`
    })
    .join(',\n')
  return `-- EdgeTX Studio generated --
${effectFunctions ? `${effectFunctions}\n` : ''}local framesFolder = "/IMAGES/FRAMES" -- Change this one path if the frames are stored elsewhere.
local frames = {
${frameData}
}
local loopAnimation = ${loop ? 'true' : 'false'}
local startedAt = getTime()

local function run(event)
  local elapsed = (getTime() - startedAt) * 10
  local total = frames[#frames][4]
  if loopAnimation and total > 0 then
    elapsed = elapsed % total
  elseif elapsed >= total then
    elapsed = math.max(0, total - 1)
  end
  local low, high = 1, #frames
  while low < high do
    local middle = math.floor((low + high) / 2)
    if elapsed < frames[middle][4] then
      high = middle
    else
      low = middle + 1
    end
  end
  local frame = frames[low]
  lcd.clear()
  lcd.drawPixmap(0, 0, frame[1])
  lcd.drawPixmap(${rightX}, 0, frame[2])
${
  effectCalls
    ? `  local time = getTime() / 100
${effectCalls}
`
    : ''
}end

return { run = run }
`
}
