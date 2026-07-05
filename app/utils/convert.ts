import { PDFDocument, degrees, type PDFImage } from 'pdf-lib'

export type ImageKind = 'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'avif' | 'heic'
export type EmbedPath = 'jpg' | 'png' | 'reencode'

export interface LoadedImage {
  id: string
  name: string
  size: number
  /** display (EXIF-oriented) pixel dimensions */
  width: number
  height: number
  kind: ImageKind
  /** bytes to embed — original file bytes, or the decoded JPEG for HEIC */
  bytes: ArrayBuffer
  embed: EmbedPath
  /** clockwise display rotation baked at draw time (raw-JPEG path only) */
  rotate: 0 | 90 | 180 | 270
  hasAlpha: boolean
  thumb: string
}

export interface ConvertOptions {
  pageSize: 'fit' | 'a4' | 'letter'
  /** millimetres */
  margin: 0 | 10
}

export class ImageLoadError extends Error {}

export class ConversionError extends Error {
  failed: LoadedImage[]
  constructor(message: string, failed: LoadedImage[]) {
    super(message)
    this.failed = failed
  }
}

const MM_TO_PT = 2.83465
const PX_TO_PT = 0.75
const MAX_PAGE_PT = 14400
const MIN_PAGE_PT = 3 // PDF spec Annex C minimum page size
const PAGE_DIMS = { a4: [595.28, 841.89], letter: [612, 792] } as const

// ---------------------------------------------------------------- sniffing

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end))
}

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length < 16) return null
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'jpg'
  if (bytes[0] === 0x89 && ascii(bytes, 1, 4) === 'PNG') return 'png'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp'
  if (ascii(bytes, 0, 4) === 'GIF8') return 'gif'
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) return 'bmp'
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12)
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heif'].includes(brand)) return 'heic'
    if (['avif', 'avis'].includes(brand)) return 'avif'
  }
  return null
}

// ------------------------------------------------------------- JPEG probes

interface JpegInfo {
  orientation: number
  components: number
}

/** Minimal segment walk: EXIF orientation (APP1) and SOF component count. */
export function parseJpeg(bytes: Uint8Array): JpegInfo {
  const info: JpegInfo = { orientation: 1, components: 3 }
  let i = 2
  while (i + 4 < bytes.length) {
    if (bytes[i] !== 0xFF) break
    while (bytes[i + 1] === 0xFF) i++ // skip fill bytes (T.81 B.1.1.2)
    if (i + 4 >= bytes.length) break
    const marker = bytes[i + 1]!
    if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
      i += 2
      continue
    }
    if (marker === 0xDA) break // start of scan — headers done
    const len = (bytes[i + 2]! << 8) | bytes[i + 3]!
    if (marker === 0xE1 && ascii(bytes, i + 4, i + 10) === 'Exif\0\0') {
      info.orientation = parseExifOrientation(bytes, i + 10) ?? info.orientation
    }
    // SOF0-SOF15 minus DHT(C4)/DAC(CC)/JPG(C8)
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      info.components = bytes[i + 9]! // precision(1) + height(2) + width(2) → components
    }
    i += 2 + len
  }
  return info
}

function parseExifOrientation(bytes: Uint8Array, tiffBase: number): number | null {
  const order = ascii(bytes, tiffBase, tiffBase + 2)
  const little = order === 'II'
  if (!little && order !== 'MM') return null
  const r16 = (o: number) => little
    ? bytes[o]! | (bytes[o + 1]! << 8)
    : (bytes[o]! << 8) | bytes[o + 1]!
  const r32 = (o: number) => little
    ? bytes[o]! | (bytes[o + 1]! << 8) | (bytes[o + 2]! << 16) | (bytes[o + 3]! << 24)
    : (bytes[o]! << 24) | (bytes[o + 1]! << 16) | (bytes[o + 2]! << 8) | bytes[o + 3]!
  const ifd = tiffBase + r32(tiffBase + 4)
  if (ifd + 2 > bytes.length) return null
  const entries = r16(ifd)
  for (let e = 0; e < entries; e++) {
    const at = ifd + 2 + e * 12
    if (at + 12 > bytes.length) return null
    if (r16(at) === 0x0112) {
      const value = r16(at + 8)
      return value >= 1 && value <= 8 ? value : null
    }
  }
  return null
}

// ------------------------------------------------------------ alpha probes

function pngHasAlpha(bytes: Uint8Array): boolean {
  const colorType = bytes[25]!
  if (colorType === 4 || colorType === 6) return true
  // palette/gray/rgb can still carry a tRNS chunk
  for (let i = 33; i + 8 < bytes.length;) {
    const len = (((bytes[i]! << 24) | (bytes[i + 1]! << 16) | (bytes[i + 2]! << 8) | bytes[i + 3]!) >>> 0)
    if (len > bytes.length - i - 12) return false // corrupt chunk — bail
    const type = ascii(bytes, i + 4, i + 8)
    if (type === 'tRNS') return true
    if (type === 'IDAT' || type === 'IEND') return false
    i += 12 + len
  }
  return false
}

function webpHasAlpha(bytes: Uint8Array): boolean {
  const chunk = ascii(bytes, 12, 16)
  if (chunk === 'VP8X') return (bytes[20]! & 0x10) !== 0
  return chunk === 'VP8L' // lossless may carry alpha — assume yes, PNG re-encode is safe
}

function bmpHasAlpha(bytes: Uint8Array): boolean {
  return ((bytes[28]! | (bytes[29]! << 8))) === 32
}

// ------------------------------------------------------------ HEIC decode

async function reencodeBitmapToJpeg(bitmap: ImageBitmap): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0)
  try {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.92))
  }
  finally {
    // release the full-res backing store promptly — WebKit caps total canvas memory
    canvas.width = canvas.height = 0
  }
}

/** Native decode where the browser supports HEIC (Safari), wasm fallback elsewhere. */
export async function decodeHeic(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    try {
      return await reencodeBitmapToJpeg(bitmap)
    }
    finally {
      bitmap.close()
    }
  }
  catch {
    const { heicTo } = await import('heic-to')
    return await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
  }
}

// ---------------------------------------------------------------- loading

function makeThumb(bitmap: ImageBitmap, max = 144): string {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export async function loadImage(file: File): Promise<LoadedImage> {
  let buf = await file.arrayBuffer()
  let bytes = new Uint8Array(buf)
  let kind = sniffImage(bytes)
  if (!kind) throw new ImageLoadError(`${file.name} isn't a supported image`)

  if (kind === 'heic') {
    let decoded: Blob
    try {
      decoded = await decodeHeic(file)
    }
    catch {
      throw new ImageLoadError(`${file.name} couldn't be decoded — try exporting it as JPEG from Photos`)
    }
    buf = await decoded.arrayBuffer()
    bytes = new Uint8Array(buf)
    kind = 'heic' // keep the badge; bytes are now a clean JPEG
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(new Blob([buf]), { imageOrientation: 'from-image' })
  }
  catch {
    throw new ImageLoadError(`${file.name} couldn't be decoded`)
  }
  let width: number, height: number, thumb: string
  try {
    width = bitmap.width
    height = bitmap.height
    thumb = makeThumb(bitmap)
  }
  finally {
    bitmap.close()
  }

  let embed: EmbedPath = 'reencode'
  let rotate: LoadedImage['rotate'] = 0
  let hasAlpha = false
  const effective = kind === 'heic' ? 'jpg' : kind

  if (effective === 'jpg') {
    const info = parseJpeg(bytes)
    // CMYK/YCCK JPEGs always declare 4 components in SOF; a bare Adobe APP14
    // on a 3-component file is common (Photoshop) and embeds fine losslessly
    const cmyk = info.components === 4
    if (cmyk) {
      embed = 'reencode'
    }
    else if (info.orientation <= 1) {
      embed = 'jpg'
    }
    else if ([3, 6, 8].includes(info.orientation)) {
      embed = 'jpg'
      rotate = info.orientation === 3 ? 180 : info.orientation === 6 ? 90 : 270
    }
    else {
      embed = 'reencode' // mirrored orientations 2/4/5/7
    }
  }
  else if (effective === 'png') {
    embed = 'png'
    hasAlpha = pngHasAlpha(bytes)
  }
  else {
    embed = 'reencode'
    // gif/avif: assume alpha — probing AVIF alpha means walking ISO-BMFF boxes;
    // worst case is a larger PNG-embedded image rather than lost transparency
    hasAlpha = effective === 'webp'
      ? webpHasAlpha(bytes)
      : effective === 'gif' || effective === 'avif'
        ? true
        : effective === 'bmp' ? bmpHasAlpha(bytes) : false
  }

  return {
    id: Math.random().toString(36).slice(2),
    name: file.name,
    size: file.size,
    width,
    height,
    kind,
    bytes: buf,
    embed,
    rotate,
    hasAlpha,
    thumb,
  }
}

// --------------------------------------------------------------- building

async function embedImage(doc: PDFDocument, item: LoadedImage, canvas: HTMLCanvasElement): Promise<PDFImage> {
  if (item.embed === 'jpg') return await doc.embedJpg(item.bytes)
  if (item.embed === 'png') {
    try {
      return await doc.embedPng(item.bytes)
    }
    catch { /* exotic PNG — fall through to re-encode */ }
  }
  const bitmap = await createImageBitmap(new Blob([item.bytes]), { imageOrientation: 'from-image' })
  try {
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    if (!item.hasAlpha) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(bitmap, 0, 0)
  }
  finally {
    bitmap.close()
  }
  const type = item.hasAlpha ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), type, 0.9))
  const out = await blob.arrayBuffer()
  return item.hasAlpha ? await doc.embedPng(out) : await doc.embedJpg(out)
}

function addImagePage(doc: PDFDocument, img: PDFImage, item: LoadedImage, opts: ConvertOptions) {
  const margin = opts.margin * MM_TO_PT
  const orientedW = item.width * PX_TO_PT
  const orientedH = item.height * PX_TO_PT

  let pw: number, ph: number
  if (opts.pageSize === 'fit') {
    pw = Math.min(Math.max(orientedW + margin * 2, MIN_PAGE_PT), MAX_PAGE_PT)
    ph = Math.min(Math.max(orientedH + margin * 2, MIN_PAGE_PT), MAX_PAGE_PT)
  }
  else {
    const [a, b] = PAGE_DIMS[opts.pageSize]
    // orientation follows the image
    ;[pw, ph] = item.width > item.height ? [b, a] : [a, b]
  }

  const cw = pw - margin * 2
  const ch = ph - margin * 2
  const scale = Math.min(cw / orientedW, ch / orientedH)
  const dw = orientedW * scale
  const dh = orientedH * scale
  if (opts.pageSize === 'fit') {
    // if the cap shrank one axis, shrink the page to the drawn size too
    pw = Math.max(dw + margin * 2, MIN_PAGE_PT)
    ph = Math.max(dh + margin * 2, MIN_PAGE_PT)
  }
  const ox = (pw - dw) / 2
  const oy = (ph - dh) / 2

  const page = doc.addPage([pw, ph])
  // raw-JPEG rotation: draw box is in oriented space; width/height args are raw
  if (item.rotate === 90) {
    page.drawImage(img, { x: ox, y: oy + dh, width: dh, height: dw, rotate: degrees(-90) })
  }
  else if (item.rotate === 270) {
    page.drawImage(img, { x: ox + dw, y: oy, width: dh, height: dw, rotate: degrees(90) })
  }
  else if (item.rotate === 180) {
    page.drawImage(img, { x: ox + dw, y: oy + dh, width: dw, height: dh, rotate: degrees(180) })
  }
  else {
    page.drawImage(img, { x: ox, y: oy, width: dw, height: dh })
  }
}

export async function imagesToPdf(
  items: LoadedImage[],
  opts: ConvertOptions,
  onProgress?: (done: number) => void,
): Promise<{ blob: Blob, failed: LoadedImage[] }> {
  const doc = await PDFDocument.create()
  const canvas = document.createElement('canvas')
  const failed: LoadedImage[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    try {
      addImagePage(doc, await embedImage(doc, item, canvas), item, opts)
    }
    catch {
      failed.push(item)
    }
    onProgress?.(i + 1)
  }
  canvas.width = canvas.height = 0
  if (doc.getPageCount() === 0) throw new ConversionError('no page could be created', failed)
  return { blob: new Blob([await doc.save()], { type: 'application/pdf' }), failed }
}

export async function imagesToZip(
  items: LoadedImage[],
  opts: ConvertOptions,
  onProgress?: (done: number) => void,
): Promise<{ blob: Blob, failed: LoadedImage[] }> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const canvas = document.createElement('canvas')
  const failed: LoadedImage[] = []
  const pad = String(items.length).length
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    try {
      const doc = await PDFDocument.create()
      addImagePage(doc, await embedImage(doc, item, canvas), item, opts)
      const base = item.name.replace(/\.[a-z0-9]+$/i, '')
      zip.file(`${String(i + 1).padStart(pad, '0')}-${base}.pdf`, await doc.save())
    }
    catch {
      failed.push(item)
    }
    onProgress?.(i + 1)
  }
  canvas.width = canvas.height = 0
  if (failed.length === items.length) throw new ConversionError('no file could be converted', failed)
  return { blob: await zip.generateAsync({ type: 'blob' }), failed }
}
