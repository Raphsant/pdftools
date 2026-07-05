export interface ConvertPageConfig {
  path: string
  title: string
  description: string
  h1: string
  intro: string
  faq: { q: string, a: string }[]
}

export const CONVERT_PAGES: Record<string, ConvertPageConfig> = {
  image: {
    path: '/image-to-pdf',
    title: 'Image to PDF free — no upload, on your device · Snuuy PDFTools',
    description: 'Turn JPG, PNG, HEIC and WebP images into a PDF in your browser. Free, no sign-up, no watermark — your photos never leave your device.',
    h1: 'Image to PDF',
    intro: 'Drop any mix of photos and pictures — JPG, PNG, HEIC straight off an iPhone, WebP, GIF, BMP or AVIF — drag them into order, and download one clean PDF (or one PDF per image). Everything happens in your browser: nothing is uploaded, nothing is compressed behind your back, and photos keep their original quality wherever the format allows it.',
    faq: [
      { q: 'Are my images uploaded to a server?', a: 'No. The conversion runs entirely in your browser using JavaScript — your images never leave your device, which also makes it fast and safe for private photos and documents.' },
      { q: 'Will my photos lose quality?', a: 'JPG photos are embedded into the PDF byte-for-byte losslessly whenever possible. Formats PDF doesn\'t support natively (WebP, GIF, BMP, AVIF) are converted once at high quality.' },
      { q: 'Is there a limit on the number of images?', a: 'No hard limit and no paywall. Very large batches are only limited by your device\'s memory — on phones we suggest converting in smaller groups.' },
    ],
  },
  jpg: {
    path: '/jpg-to-pdf',
    title: 'JPG to PDF free — no upload, on your device · Snuuy PDFTools',
    description: 'Convert JPG photos to PDF in your browser — losslessly where possible. Free, unlimited, no sign-up, no watermark, nothing uploaded.',
    h1: 'JPG to PDF',
    intro: 'Combine one or many JPG photos into a single PDF, or get one PDF per photo as a ZIP. Unlike upload-based converters, your JPGs are embedded directly into the PDF on your device — in most cases byte-for-byte, with zero recompression — and sideways phone photos are rotated correctly using their EXIF orientation.',
    faq: [
      { q: 'Does converting JPG to PDF reduce image quality?', a: 'No — in most cases the original JPG data is embedded into the PDF unchanged, so quality is identical to the source file. Only unusual JPGs (CMYK color, mirrored orientation) are re-encoded once at high quality.' },
      { q: 'Why do other converters rotate my photos sideways?', a: 'Phone cameras store rotation as EXIF metadata that many converters ignore. This tool reads the EXIF orientation and bakes the correct rotation into the PDF page.' },
      { q: 'Can I convert multiple JPGs into one PDF?', a: 'Yes — add as many as you like, drag them into order, and choose one combined PDF or one PDF per image as a ZIP.' },
    ],
  },
  png: {
    path: '/png-to-pdf',
    title: 'PNG to PDF free — no upload, on your device · Snuuy PDFTools',
    description: 'Convert PNG images to PDF in your browser, transparency preserved. Free, unlimited, no sign-up, no watermark, nothing uploaded.',
    h1: 'PNG to PDF',
    intro: 'Turn PNG screenshots, graphics and scans into a PDF without uploading them anywhere. PNGs are embedded losslessly — sharp text and line art stay sharp, and transparency is preserved rather than being flattened onto a random background.',
    faq: [
      { q: 'Is PNG transparency kept in the PDF?', a: 'Yes — PNGs with an alpha channel are embedded with their transparency intact rather than being flattened.' },
      { q: 'Are screenshots safe to convert here?', a: 'Yes. Nothing is uploaded — conversion happens in your browser, so screenshots with personal information never leave your device.' },
      { q: 'Will text in my PNG stay sharp?', a: 'Yes — PNG data is embedded losslessly, so screenshots and graphics keep pixel-perfect sharpness at their original resolution.' },
    ],
  },
  heic: {
    path: '/heic-to-pdf',
    title: 'HEIC to PDF free — no upload, on your device · Snuuy PDFTools',
    description: 'Convert iPhone HEIC photos to PDF right in your browser. Free, no sign-up, no watermark — photos never leave your device.',
    h1: 'HEIC to PDF',
    intro: 'iPhone photos come as HEIC files that many tools and offices can\'t open. Drop them here and get a normal PDF — decoded entirely on your device, so your camera roll stays private. On Safari the decode is instant and native; on other browsers a small decoder loads automatically the first time you add a HEIC.',
    faq: [
      { q: 'Why won\'t my HEIC photos open anywhere?', a: 'HEIC is Apple\'s default camera format. It compresses better than JPG but isn\'t widely supported — converting to PDF (or JPG) makes photos shareable everywhere.' },
      { q: 'Do my iPhone photos get uploaded?', a: 'No. HEIC decoding runs inside your browser — on Safari natively, elsewhere via a small WebAssembly decoder — so photos never leave your device.' },
      { q: 'A HEIC file failed to convert — what can I do?', a: 'Some very new capture modes may not decode in the browser yet. Share or export the photo as JPEG from the Photos app, then convert that.' },
    ],
  },
  webp: {
    path: '/webp-to-pdf',
    title: 'WebP to PDF free — no upload, on your device · Snuuy PDFTools',
    description: 'Convert WebP images to PDF in your browser. Free, unlimited, no sign-up, no watermark, nothing uploaded.',
    h1: 'WebP to PDF',
    intro: 'WebP images saved from the web often need to become something more shareable. Drop them here and get a clean PDF — converted once at high quality, entirely on your device, with transparency preserved where the source has it.',
    faq: [
      { q: 'Why do images I save from websites end up as WebP?', a: 'Many sites serve WebP because it\'s smaller than JPG or PNG. It\'s a fine web format but awkward to print or send — converting to PDF fixes that.' },
      { q: 'Is WebP converted losslessly?', a: 'PDF has no native WebP support, so each image is decoded and re-encoded once at high quality — visually indistinguishable for photos, and transparent WebP is kept transparent.' },
      { q: 'What about animated WebP or GIF?', a: 'Only the first frame is used — PDF pages are static. For the full animation, keep the original file.' },
    ],
  },
}
