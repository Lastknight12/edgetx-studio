import {
  LUA_OK,
  lua_close,
  lua_createtable,
  lua_pop,
  lua_pcall,
  lua_pushjsfunction,
  lua_pushnumber,
  lua_pushvalue,
  lua_setfield,
  lua_setglobal,
  lua_tointeger,
  lua_tolstring,
} from 'fengari/src/lua.js'
import { luaL_loadstring, luaL_newstate, luaL_requiref } from 'fengari/src/lauxlib.js'
import { luaopen_base } from 'fengari/src/lbaselib.js'
import { luaopen_math } from 'fengari/src/lmathlib.js'
import { to_jsstring, to_luastring } from 'fengari/src/fengaricore.js'
import type { DeviceProfile, EffectInstance } from '@/types/studio'
import { generateLuaEffectProgram } from '@/modules/lua/generateLua'

interface LuaEffectProgram {
  state: import('fengari').LuaState
  setPixels(pixels: Uint8ClampedArray): void
}

const programs = new Map<string, LuaEffectProgram>()
const programLimit = 12
const eraseFlag = 1
const forceFlag = 2

function errorFromStack(state: import('fengari').LuaState, fallback: string): Error {
  const message = lua_tolstring(state, -1)
  return new Error(message ? to_jsstring(message) : fallback)
}

function createProgram(
  source: string,
  device: DeviceProfile,
  initialPixels: Uint8ClampedArray,
): LuaEffectProgram {
  const state = luaL_newstate()
  luaL_requiref(state, to_luastring('_G'), luaopen_base, 1)
  lua_pop(state, 1)
  luaL_requiref(state, to_luastring('math'), luaopen_math, 1)
  lua_pop(state, 1)
  let pixels = initialPixels

  const drawLine = (lineState: import('fengari').LuaState): number => {
    const x1 = Number(lua_tointeger(lineState, 1))
    const y1 = Number(lua_tointeger(lineState, 2))
    const x2 = Number(lua_tointeger(lineState, 3))
    const y2 = Number(lua_tointeger(lineState, 4))
    const flags = Number(lua_tointeger(lineState, 6))
    drawLcdLine(pixels, x1, y1, x2, y2, flags, device.width, device.height)
    return 0
  }

  lua_createtable(state, 0, 1)
  lua_pushjsfunction(state, drawLine)
  lua_setfield(state, -2, to_luastring('drawLine'))
  lua_setglobal(state, to_luastring('lcd'))

  lua_pushjsfunction(state, (timeState: import('fengari').LuaState): number => {
    lua_pushnumber(timeState, Math.floor(Date.now() / 10))
    return 1
  })
  lua_setglobal(state, to_luastring('getTime'))

  setGlobalNumber(state, 'SOLID', 0)
  setGlobalNumber(state, 'ERASE', eraseFlag)
  setGlobalNumber(state, 'FORCE', forceFlag)

  const loadStatus = luaL_loadstring(state, to_luastring(source))
  if (loadStatus !== LUA_OK) {
    const error = errorFromStack(state, 'Unable to compile Lua effect preview')
    lua_close(state)
    throw error
  }
  const runStatus = lua_pcall(state, 0, 1, 0)
  if (runStatus !== LUA_OK) {
    const error = errorFromStack(state, 'Unable to initialize Lua effect preview')
    lua_close(state)
    throw error
  }

  return {
    state,
    setPixels(nextPixels) {
      pixels = nextPixels
    },
  }
}

function setGlobalNumber(state: import('fengari').LuaState, name: string, value: number): void {
  lua_pushnumber(state, value)
  lua_setglobal(state, to_luastring(name))
}

function getProgram(
  source: string,
  device: DeviceProfile,
  pixels: Uint8ClampedArray,
): LuaEffectProgram {
  let program = programs.get(source)
  if (program) {
    program.setPixels(pixels)
    programs.delete(source)
    programs.set(source, program)
    return program
  }

  program = createProgram(source, device, pixels)
  programs.set(source, program)
  if (programs.size > programLimit) {
    const oldestSource = programs.keys().next().value as string | undefined
    if (oldestSource) {
      const oldest = programs.get(oldestSource)
      if (oldest) lua_close(oldest.state)
      programs.delete(oldestSource)
    }
  }
  return program
}

export function renderLuaEffectProgram(
  context: CanvasRenderingContext2D,
  effects: EffectInstance[],
  device: DeviceProfile,
  time: number,
): boolean {
  const source = generateLuaEffectProgram(effects, device)
  if (!source) return false
  const image = context.getImageData(0, 0, device.width, device.height)
  const program = getProgram(source, device, image.data)
  lua_pushvalue(program.state, -1)
  lua_pushnumber(program.state, time)
  const status = lua_pcall(program.state, 1, 0, 0)
  if (status !== LUA_OK) {
    const error = errorFromStack(program.state, 'Lua effect preview failed')
    programs.delete(source)
    lua_close(program.state)
    throw error
  }
  context.putImageData(image, 0, 0)
  return true
}

function drawLcdLine(
  pixels: Uint8ClampedArray,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  flags: number,
  width: number,
  height: number,
): void {
  let x = startX
  let y = startY
  const dx = Math.abs(endX - x)
  const sx = x < endX ? 1 : -1
  const dy = -Math.abs(endY - y)
  const sy = y < endY ? 1 : -1
  let error = dx + dy

  while (true) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const offset = (y * width + x) * 4
      const current = pixels[offset] ?? 255
      const level = flags === eraseFlag ? 255 : flags === forceFlag ? 0 : current < 128 ? 255 : 0
      pixels[offset] = level
      pixels[offset + 1] = level
      pixels[offset + 2] = level
      pixels[offset + 3] = 255
    }
    if (x === endX && y === endY) break
    const doubledError = 2 * error
    if (doubledError >= dy) {
      error += dy
      x += sx
    }
    if (doubledError <= dx) {
      error += dx
      y += sy
    }
  }
}
