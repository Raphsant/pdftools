<script setup lang="ts">
import type { LoadedPdf } from '~/utils/pdf'

const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: 'Split PDF free — Snuuy PDFTools',
  description: 'Split a PDF into single pages or extract a page range — free, no sign-up, and your file never leaves your device.',
  ogTitle: 'Split PDF free — Snuuy PDFTools',
  ogDescription: 'Split or extract PDF pages, right in your browser. Nothing gets uploaded.',
  ogType: 'website',
  ogUrl: `${siteUrl}/split`,
  ogImage: `${siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og.png`,
})

useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/split` }] })

const toast = useToast()
const { recordExport } = useTipJar()

const file = ref<LoadedPdf | null>(null)
const loadError = ref('')
const mode = ref<'every' | 'range'>('every')
const rangeInput = ref('')
const working = ref(false)
const progress = ref(0)

const rangeResult = computed(() =>
  file.value && mode.value === 'range' && rangeInput.value.trim()
    ? parsePageRanges(rangeInput.value, file.value.pageCount)
    : null)

const rangeError = computed(() =>
  rangeResult.value && 'error' in rangeResult.value ? rangeResult.value.error : '')

const canSplit = computed(() => {
  if (!file.value) return false
  if (mode.value === 'every') return true
  return !!rangeResult.value && 'indices' in rangeResult.value
})

async function onFiles(picked: File[]) {
  loadError.value = ''
  try {
    file.value = await loadPdf(picked[0]!)
  }
  catch (error) {
    file.value = null
    loadError.value = error instanceof PdfLoadError ? error.message : 'Couldn\'t read that file'
  }
}

function baseName() {
  return (file.value?.name.replace(/\.pdf$/i, '') || 'document')
}

async function split() {
  if (!file.value || !canSplit.value || working.value) return
  working.value = true
  progress.value = 0
  try {
    if (mode.value === 'every') {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const total = file.value.pageCount
      const pad = String(total).length
      for (let i = 0; i < total; i++) {
        zip.file(`${baseName()}-page-${String(i + 1).padStart(pad, '0')}.pdf`, await extractPages(file.value.doc, [i]))
        progress.value = i + 1
      }
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${baseName()}-pages.zip`)
      toast.add({ title: `Split into ${total} PDFs`, icon: 'i-lucide-circle-check', color: 'success', duration: 2500 })
    }
    else {
      const indices = (rangeResult.value as { indices: number[] }).indices
      saveBlob(await extractPages(file.value.doc, indices), `${baseName()}-extract.pdf`)
      toast.add({ title: `Extracted ${indices.length} page${indices.length === 1 ? '' : 's'}`, icon: 'i-lucide-circle-check', color: 'success', duration: 2500 })
    }
    recordExport()
  }
  catch {
    toast.add({ title: 'Something went wrong while splitting', icon: 'i-lucide-triangle-alert', color: 'error' })
  }
  finally {
    working.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <AppHeader />

    <main class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:py-12">
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-lg font-semibold text-highlighted">
            Split PDF
          </h1>
          <p class="mt-1 text-sm text-muted">
            Break a PDF into single pages, or pull out just the ones you need. Everything happens on your device.
          </p>
        </div>

        <PdfDropzone @files="onFiles" />

        <p v-if="loadError" class="flex items-center gap-1.5 text-xs text-warning">
          <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
          {{ loadError }}
        </p>

        <template v-if="file">
          <div class="flex min-h-14 items-center gap-3 rounded-lg border border-default px-3 py-2">
            <UIcon name="i-lucide-file-text" class="size-4 shrink-0 text-dimmed" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-highlighted">{{ file.name }}</span>
              <span class="block text-xs text-muted">{{ file.pageCount }} pages · {{ formatBytes(file.size) }}</span>
            </span>
          </div>

          <section class="flex flex-col gap-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">
              How to split
            </h2>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                :class="mode === 'every'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-default text-toned hover:bg-elevated'"
                @click="mode = 'every'"
              >
                <UIcon name="i-lucide-layers" class="size-4 shrink-0" />
                Every page
              </button>
              <button
                type="button"
                class="flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                :class="mode === 'range'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-default text-toned hover:bg-elevated'"
                @click="mode = 'range'"
              >
                <UIcon name="i-lucide-text-select" class="size-4 shrink-0" />
                Pick pages
              </button>
            </div>
            <template v-if="mode === 'range'">
              <UInput
                v-model="rangeInput"
                size="lg"
                :placeholder="`e.g. 1-3, 7 (max ${file.pageCount})`"
                autocomplete="off"
              />
              <p v-if="rangeError" class="flex items-center gap-1.5 text-xs text-warning">
                <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
                {{ rangeError }}
              </p>
            </template>
            <p v-else class="text-xs text-muted">
              You'll get a ZIP with {{ file.pageCount }} single-page PDFs.
            </p>
          </section>

          <div class="flex flex-col gap-2">
            <UButton
              :label="mode === 'every' ? 'Split into pages' : 'Extract pages'"
              icon="i-lucide-scissors"
              size="lg"
              block
              :disabled="!canSplit"
              :loading="working"
              @click="split"
            />
            <UProgress v-if="working && mode === 'every'" :model-value="progress" :max="file.pageCount" size="sm" />
          </div>
        </template>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
