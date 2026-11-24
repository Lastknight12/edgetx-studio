import type { DeviceProfile } from '@/types/studio'

export const deviceProfiles: DeviceProfile[] = [
  {
    id: 'radiomaster-pocket',
    name: 'RadioMaster Pocket',
    width: 128,
    height: 64,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '128 × 64 monochrome display profile.',
      'Confirm Lua image loading and storage limits for your EdgeTX firmware before using a hardware adapter.',
    ],
  },
  {
    id: 'radiomaster-tx12-mkii',
    name: 'RadioMaster TX12 Mark II',
    width: 128,
    height: 64,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '128 × 64 monochrome LCD display.',
      'Confirm Lua image loading and storage limits for your EdgeTX firmware before using a hardware adapter.',
    ],
  },
  {
    id: 'radiomaster-zorro',
    name: 'RadioMaster Zorro',
    width: 128,
    height: 64,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '128 × 64 monochrome LCD display.',
      'Confirm Lua image loading and storage limits for your EdgeTX firmware before using a hardware adapter.',
    ],
  },
  {
    id: 'radiomaster-boxer',
    name: 'RadioMaster Boxer',
    width: 128,
    height: 64,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '128 × 64 monochrome LCD display.',
      'Confirm Lua image loading and storage limits for your EdgeTX firmware before using a hardware adapter.',
    ],
  },
  {
    id: 'radiomaster-mt12',
    name: 'RadioMaster MT12',
    width: 128,
    height: 64,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '128 × 64 monochrome LCD display.',
      'Confirm Lua image loading and storage limits for your EdgeTX firmware before using a hardware adapter.',
    ],
  },
  {
    id: 'radiomaster-tx16s-mkii',
    name: 'RadioMaster TX16S Mark II',
    width: 480,
    height: 272,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '480 × 272 full-color touchscreen; this project exports monochrome 1-bit BMP images.',
      'Requires EdgeTX 2.6.0 or later for touchscreen support. Confirm image loading and performance on the radio.',
    ],
  },
  {
    id: 'radiomaster-tx16s-mkiii',
    name: 'RadioMaster TX16S MK3',
    width: 800,
    height: 480,
    colorDepth: 1,
    split: 'vertical',
    notes: [
      '800 × 480 color touchscreen; this project exports monochrome 1-bit BMP images.',
      'Requires EdgeTX 3.0.0 or later. Confirm image loading and animation performance on the radio.',
    ],
  },
]

export const defaultDevice = deviceProfiles[0]!

export function getDeviceProfile(id: string): DeviceProfile {
  const profile = deviceProfiles.find((device) => device.id === id)
  if (!profile) throw new Error(`Unknown device profile: ${id}`)
  return profile
}
