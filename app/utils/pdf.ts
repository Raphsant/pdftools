import { PDFDocument } from 'pdf-lib'

export interface LoadedPdf {
  id: string
  name: string
  size: number
  pageCount: number
  doc: PDFDocument
  bytes: ArrayBuffer
}

export class PdfLoadError extends Error {}

export async function loadPdf(file: File): Promise<LoadedPdf> {
  const bytes = await file.arrayBuffer()
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(bytes)
  }
  catch (error) {
    if (String(error).toLowerCase().includes('encrypt'))
      throw new PdfLoadError(`${file.name} is password-protected — remove the password first, then try again`)
    throw new PdfLoadError(`${file.name} doesn't look like a valid PDF`)
  }
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    pageCount: doc.getPageCount(),
    doc,
    bytes,
  }
}

export async function mergePdfs(items: LoadedPdf[]): Promise<Blob> {
  const out = await PDFDocument.create()
  for (const item of items) {
    const pages = await out.copyPages(item.doc, item.doc.getPageIndices())
    pages.forEach(page => out.addPage(page))
  }
  return new Blob([await out.save()], { type: 'application/pdf' })
}

export async function extractPages(src: PDFDocument, indices: number[]): Promise<Blob> {
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, indices)
  pages.forEach(page => out.addPage(page))
  return new Blob([await out.save()], { type: 'application/pdf' })
}

/** Parse "1-3, 7, 9-12" into zero-based page indices, validated against pageCount. */
export function parsePageRanges(input: string, pageCount: number): { indices: number[] } | { error: string } {
  const indices: number[] = []
  const parts = input.split(',').map(p => p.trim()).filter(Boolean)
  if (!parts.length) return { error: 'Enter pages like “1-3, 7”' }
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!match) return { error: `“${part}” isn't a page or range` }
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : start
    if (start < 1 || end > pageCount)
      return { error: `“${part}” is outside 1–${pageCount}` }
    if (end < start) return { error: `“${part}” is backwards` }
    for (let i = start; i <= end; i++) indices.push(i - 1)
  }
  return { indices }
}

/** Render page thumbnails with pdf.js (client-only). */
export async function renderThumbs(
  bytes: ArrayBuffer,
  width = 144,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  // @ts-expect-error vite ?url import has no type declaration
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  // pdf.js transfers the buffer to its worker — hand it a copy
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) })
  const doc = await loadingTask.promise
  const thumbs: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: width / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise
    thumbs.push(canvas.toDataURL('image/jpeg', 0.8))
    onProgress?.(i, doc.numPages)
  }
  await loadingTask.destroy()
  return thumbs
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
