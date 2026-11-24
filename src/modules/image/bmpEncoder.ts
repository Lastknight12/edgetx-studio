export function encodeMonochromeBmp(pixels: Uint8Array, width: number, height: number): Blob {
  if (pixels.length !== width * height) throw new Error('Pixel data does not match BMP dimensions')

  const rowSize = Math.ceil(width / 32) * 4
  const pixelDataSize = rowSize * height
  const dataOffset = 14 + 40 + 8
  const buffer = new ArrayBuffer(dataOffset + pixelDataSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint8(0, 0x42)
  view.setUint8(1, 0x4d)
  view.setUint32(2, buffer.byteLength, true)
  view.setUint32(10, dataOffset, true)
  view.setUint32(14, 40, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 1, true)
  view.setUint32(34, pixelDataSize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 2, true)
  view.setUint32(50, 2, true)
  // Keep palette index 0 black and index 1 white for EdgeTX B&W drawPixmap.
  bytes.set([0, 0, 0, 0, 255, 255, 255, 0], 54)

  for (let y = 0; y < height; y++) {
    const rowOffset = dataOffset + (height - 1 - y) * rowSize
    for (let x = 0; x < width; x++) {
      if (!pixels[y * width + x]) bytes[rowOffset + (x >> 3)]! |= 0x80 >> (x & 7)
    }
  }
  return new Blob([buffer], { type: 'image/bmp' })
}
