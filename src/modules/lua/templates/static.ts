import type { DeviceProfile } from '@/types/studio'

export function staticLuaTemplate(
  device: DeviceProfile,
  effectFunctions: string,
  effectCalls: string,
): string {
  const rightX = Math.floor(device.width / 2)
  return `-- EdgeTX Studio static image renderer
${effectFunctions ? `${effectFunctions}\n` : ''}local function run(event)
  lcd.clear()
  lcd.drawPixmap(0, 0, "/IMAGES/image_left.bmp")
  lcd.drawPixmap(${rightX}, 0, "/IMAGES/image_right.bmp")
${
  effectCalls
    ? `  local time = getTime() / 100
${effectCalls}\n`
    : ''
}end

return { run = run }
`
}
