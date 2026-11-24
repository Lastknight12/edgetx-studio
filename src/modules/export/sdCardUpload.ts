import type { ExportResult } from './exportProject'

export interface ImageFolderChoice {
  path: string
  handle: FileSystemDirectoryHandle
}

export type ScriptFolderChoice = ImageFolderChoice

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

export class FolderAccessError extends Error {
  constructor(
    message: string,
    readonly reason: 'insecure-context' | 'embedded-preview' | 'unsupported-browser',
  ) {
    super(message)
  }
}

export async function chooseSdCardRoot(): Promise<FileSystemDirectoryHandle> {
  if (!window.isSecureContext) {
    throw new FolderAccessError(
      'Folder access requires HTTPS or a localhost address.',
      'insecure-context',
    )
  }
  if (window.top !== window.self) {
    throw new FolderAccessError(
      'This app is running inside an embedded preview. Open it in a new browser tab to access the SD card.',
      'embedded-preview',
    )
  }
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker
  if (!picker) {
    throw new FolderAccessError(
      'This browser does not provide folder access. Use a desktop Chromium-based browser such as Chrome or Edge.',
      'unsupported-browser',
    )
  }
  return picker.call(window, { mode: 'readwrite' })
}

async function findFolders(
  root: FileSystemDirectoryHandle,
  folderPath: string,
): Promise<ImageFolderChoice[]> {
  let base = root
  for (const segment of folderPath.split('/')) {
    base = await base.getDirectoryHandle(segment, { create: true })
  }
  const choices: ImageFolderChoice[] = []

  async function visit(handle: FileSystemDirectoryHandle, path: string, depth: number) {
    choices.push({ path, handle })
    if (!depth) return
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === 'directory') {
        await visit(entry as FileSystemDirectoryHandle, `${path}/${name}`, depth - 1)
      }
    }
  }

  await visit(base, folderPath, 4)
  return choices.sort((left, right) => left.path.localeCompare(right.path))
}

export function findImageFolders(root: FileSystemDirectoryHandle) {
  return findFolders(root, 'IMAGES')
}

export function findScriptFolders(root: FileSystemDirectoryHandle) {
  return findFolders(root, 'SCRIPTS/TELEMETRY')
}

export async function createImageFolder(
  parent: ImageFolderChoice,
  requestedName: string,
): Promise<ImageFolderChoice> {
  const trimmedName = requestedName.trim()
  if (!trimmedName) throw new Error('Enter a name for the new image folder.')
  if (trimmedName === '.' || trimmedName === '..' || /[\\/]/.test(trimmedName)) {
    throw new Error('Folder name must be a single folder name without slashes.')
  }
  const name = trimmedName.toUpperCase()
  const handle = await parent.handle.getDirectoryHandle(name, { create: true })
  return { path: `${parent.path}/${name}`, handle }
}

export function luaForImageFolder(lua: string, folderPath: string, isAnimation: boolean): string {
  const luaFolder = `/${folderPath.replaceAll('\\', '/').replaceAll('"', '\\"')}`
  if (isAnimation) {
    return lua.replace(/local framesFolder = "[^"]+"/, () => `local framesFolder = "${luaFolder}"`)
  }
  return lua
    .replace(/"\/IMAGES\/image_left\.bmp"/, () => `"${luaFolder}/image_left.bmp"`)
    .replace(/"\/IMAGES\/image_right\.bmp"/, () => `"${luaFolder}/image_right.bmp"`)
}

export async function uploadExportToSdCard(
  imageFolder: ImageFolderChoice,
  scriptFolder: ScriptFolderChoice,
  result: Pick<ExportResult, 'files' | 'lua'>,
  isAnimation: boolean,
  onProgress: (completed: number, total: number, fileName: string) => void,
): Promise<void> {
  const lua = luaForImageFolder(result.lua, imageFolder.path, isAnimation)
  for (let index = 0; index < result.files.length; index++) {
    const file = result.files[index]!
    const segments = file.name.split('/').filter(Boolean)
    const fileName = segments.at(-1)
    if (!fileName) continue

    let destination: FileSystemDirectoryHandle
    let blob = file.blob
    if (segments[0]?.toUpperCase() === 'IMAGES') {
      destination = imageFolder.handle
    } else if (segments[0]?.toUpperCase() === 'SCRIPTS') {
      destination = scriptFolder.handle
      if (fileName.toLowerCase() === 'studio.lua') {
        blob = new Blob([lua], { type: 'text/plain' })
      }
    } else {
      continue
    }

    const target = await destination.getFileHandle(fileName, { create: true })
    const writable = await target.createWritable()
    await writable.write(blob)
    await writable.close()
    onProgress(index + 1, result.files.length, fileName)
  }
}
