import type { DeviceProfile } from '@/types/studio'

export function animationLuaTemplate(
  device: DeviceProfile,
  frames: { duration: number }[],
  loop: boolean,
  effectFunctions: string,
  effectCalls: string,
): string {
  const rightX = Math.floor(device.width / 2)
  const frameData = frames
    .map(({ duration }, index) => {
      const safeDuration = Math.max(1, Math.round(duration))
      const number = String(index + 1).padStart(3, '0')
      return `  { framesFolder .. "/${number}_left.bmp", framesFolder .. "/${number}_right.bmp", ${safeDuration} }`
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
  local total = 0
  for index = 1, #frames do total = total + frames[index][3] end
  if loopAnimation and total > 0 then
    elapsed = elapsed % total
  elseif elapsed >= total then
    elapsed = math.max(0, total - 1)
  end
  local frameIndex = 1
  while frameIndex < #frames and elapsed >= frames[frameIndex][3] do
    elapsed = elapsed - frames[frameIndex][3]
    frameIndex = frameIndex + 1
  end
  local frame = frames[frameIndex]
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
