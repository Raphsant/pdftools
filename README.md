# Snuuy PDFTools

Merge, split, reorder, and turn images into PDFs. Everything is client-side and runs in your browser, so your files are never uploaded anywhere.

The big free PDF sites send your documents to their servers to do the work, then stop you after a couple of goes a day. That's a rough deal when the file is a contract, a passport scan, or a medical form. These tools do the same jobs with JavaScript on your own machine, so the file never leaves it.

Live at [pdf.snuuy.com](https://pdf.snuuy.com).

## The tools

**Merge** — drop in several PDFs, drag them into order, get one file back.

**Split** — break a PDF into single pages (downloaded as a ZIP) or pull out a range like `1-3, 7`.

**Reorder** — every page shows up as a thumbnail. Drag to rearrange, delete the ones you don't want, save the result.

**Convert to PDF** — JPG, PNG, WebP, GIF, BMP, AVIF, and HEIC straight off an iPhone. Combine them into one PDF or get one per image in a ZIP. JPGs are dropped in without re-compressing whenever that's possible, and sideways phone photos come out upright because it reads the EXIF rotation that most converters skip.

The common conversions have their own pages — [jpg to pdf](https://pdf.snuuy.com/jpg-to-pdf), [png to pdf](https://pdf.snuuy.com/png-to-pdf), [heic to pdf](https://pdf.snuuy.com/heic-to-pdf), [webp to pdf](https://pdf.snuuy.com/webp-to-pdf) — but every page takes every format.

No account, no watermark, no daily cap.

## Built with

Nuxt 4 and Nuxt UI on top of pdf-lib (the PDF work), pdfjs-dist (page thumbnails), jszip (ZIP downloads), vuedraggable (the drag ordering), and heic-to (iPhone HEIC decoding, pulled in only when you actually drop a HEIC).

## Running it locally

Node 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Self-hosting

The GitHub Actions workflow builds and pushes a Docker image to GHCR on every push to main. Set the image name in `compose.yaml` and run it under Dockge or `docker compose`. It serves on port 3000 inside the container; the compose file maps it to 3001 so it can sit next to the other Snuuy tools on one box.

## The rest of Snuuy

- [QRMaker](https://qr.snuuy.com) — styled QR codes, checked before you download
- [Invoice](https://invoice.snuuy.com) — free invoices, no signup

Same rule across all of them: it runs on your device, it's free, and nothing gets uploaded.
