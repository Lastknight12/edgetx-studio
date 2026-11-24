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
]

export const defaultDevice = deviceProfiles[0]!

export function getDeviceProfile(id: string): DeviceProfile {
  const profile = deviceProfiles.find((device) => device.id === id)
  if (!profile) throw new Error(`Unknown device profile: ${id}`)
  return profile
}
