import { fallingCardsLua } from './fallingCards'
import { fallingSakuraLua } from './fallingSakura'
import { blinkingEyesLua } from './blinkingEyes'
import type { LuaEffectGenerator } from './types'

export const luaEffectRegistry: LuaEffectGenerator[] = [
  fallingSakuraLua,
  blinkingEyesLua,
  fallingCardsLua,
]

export function getLuaEffectGenerator(type: string): LuaEffectGenerator {
  const generator = luaEffectRegistry.find((item) => item.type === type)
  if (!generator) throw new Error(`No Lua generator is registered for effect: ${type}`)
  return generator
}
