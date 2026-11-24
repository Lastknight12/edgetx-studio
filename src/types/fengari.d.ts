declare module 'fengari' {
  export interface LuaState {}
  export type LuaFunction = (state: LuaState) => number

  export const lua: {
    LUA_OK: number
    lua_close(state: LuaState): void
    lua_createtable(state: LuaState, arraySize: number, recordSize: number): void
    lua_gettop(state: LuaState): number
    lua_pop(state: LuaState, count: number): void
    lua_pcall(
      state: LuaState,
      argumentCount: number,
      resultCount: number,
      errorFunction: number,
    ): number
    lua_pushjsfunction(state: LuaState, callback: LuaFunction): void
    lua_pushnumber(state: LuaState, value: number): void
    lua_pushvalue(state: LuaState, index: number): void
    lua_setfield(state: LuaState, index: number, key: Uint8Array): void
    lua_setglobal(state: LuaState, name: Uint8Array): void
    lua_tointeger(state: LuaState, index: number): number | false
    lua_tolstring(state: LuaState, index: number): Uint8Array | null
  }

  export const lauxlib: {
    luaL_loadstring(state: LuaState, source: Uint8Array): number
    luaL_newstate(): LuaState
  }

  export const lualib: {
    luaL_openlibs(state: LuaState): void
  }

  export function to_jsstring(value: Uint8Array): string
  export function to_luastring(value: string): Uint8Array
}

declare module 'fengari/src/lua.js' {
  export const LUA_OK: number
  export function lua_close(state: import('fengari').LuaState): void
  export function lua_createtable(
    state: import('fengari').LuaState,
    arraySize: number,
    recordSize: number,
  ): void
  export function lua_pop(state: import('fengari').LuaState, count: number): void
  export function lua_pcall(
    state: import('fengari').LuaState,
    argumentCount: number,
    resultCount: number,
    errorFunction: number,
  ): number
  export function lua_pushjsfunction(
    state: import('fengari').LuaState,
    callback: import('fengari').LuaFunction,
  ): void
  export function lua_pushnumber(state: import('fengari').LuaState, value: number): void
  export function lua_pushvalue(state: import('fengari').LuaState, index: number): void
  export function lua_setfield(
    state: import('fengari').LuaState,
    index: number,
    key: Uint8Array,
  ): void
  export function lua_setglobal(state: import('fengari').LuaState, name: Uint8Array): void
  export function lua_tointeger(state: import('fengari').LuaState, index: number): number | false
  export function lua_tolstring(state: import('fengari').LuaState, index: number): Uint8Array | null
}

declare module 'fengari/src/lauxlib.js' {
  export function luaL_loadstring(state: import('fengari').LuaState, source: Uint8Array): number
  export function luaL_newstate(): import('fengari').LuaState
  export function luaL_requiref(
    state: import('fengari').LuaState,
    name: Uint8Array,
    openFunction: import('fengari').LuaFunction,
    setGlobal: number,
  ): void
}

declare module 'fengari/src/lbaselib.js' {
  export const luaopen_base: import('fengari').LuaFunction
}

declare module 'fengari/src/lmathlib.js' {
  export const luaopen_math: import('fengari').LuaFunction
}

declare module 'fengari/src/fengaricore.js' {
  export function to_jsstring(value: Uint8Array): string
  export function to_luastring(value: string): Uint8Array
}
