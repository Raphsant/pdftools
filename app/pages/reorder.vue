<script setup lang="ts">
import draggable from 'vuedraggable'
import type { LoadedPdf } from '~/utils/pdf'

const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: 'Reorder PDF pages free — Snuuy PDFTools',
  description: 'Drag PDF pages into a new order or delete pages — free, no sign-up, and your file never leaves your device.',
  ogTitle: 'Reorder PDF pages free — Snuuy PDFTools',
  ogDescription: 'Rearrange or delete PDF pages, right in your browser. Nothing gets uploaded.',
  ogType: 'website',
  ogUrl: `${siteUrl}/reorder`,
  ogImage: `${siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og.png`,
})

useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/reorder` }] })

const toast = useToast()
const { recordExport } = useTipJar()

interface PageItem {
  id: string
  originalIndex: number
  thumb: string
}

const file = ref<LoadedPdf | null>(null)
const loadError = ref('')
const pages = ref<PageItem[]>([])
const rendering = ref(false)
const renderProgress = ref(0)
const saving = ref(false)

const changed = computed(() =>
  !!file.value
  && (pages.value.length !== file.value.pageCount
    || pages.value.some((p, i) => p.originalIndex !== i)))

async function onFiles(picked: File[]) {
  loadError.value = ''
  pages.value = []
  try {
    file.value = await loadPdf(picked[0]!)
  }
  catch (error) {
    file.value = null
    loadError.value = error instanceof PdfLoadError ? error.message : 'Couldn\'t read that file'
    return
  }
  rendering.value = true
  renderProgress.value = 0
  try {
    const thumbs = await renderThumbs(file.value.bytes, 144, (done) => {
      renderProgress.value = done
    })
    pages.value = thumbs.map((thumb, i) => ({ id: `p-${i}`, originalIndex: i, thumb }))
  }
  catch {
    loadError.value = 'Couldn\'t render page previews for that file'
    file.value = null
  }
  finally {
    rendering.value = false
  }
}

function removePage(id: string) {
  pages.value = pages.value.filter(p => p.id !== id)
}

async function save() {
  if (!file.value || !pages.value.length || saving.value) return
  saving.value = true
  try {
    const blob = await extractPages(file.value.doc, pages.value.map(p => p.originalIndex))
    saveBlob(blob, `${file.value.name.replace(/\.pdf$/i, '')}-reordered.pdf`)
    toast.add({
      title: `Saved with ${pages.value.length} page${pages.value.length === 1 ? '' : 's'}`,
      icon: 'i-lucide-circle-check',
      color: 'success',
      duration: 2500,
    })
    recordExport()
  }
  catch {
    toast.add({ title: 'Something went wrong while saving', icon: 'i-lucide-triangle-alert', color: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <AppHeader />

    <main class="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:py-12">
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-lg font-semibold text-highlighted">
            Reorder pages
          </h1>
          <p class="mt-1 text-sm text-muted">
            Drag pages into a new order, or remove the ones you don't need. Everything happens on your device.
          </p>
        </div>

        <PdfDropzone @files="onFiles" />

        <p v-if="loadError" class="flex items-center gap-1.5 text-xs text-warning">
          <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
          {{ loadError }}
        </p>

        <div v-if="rendering" class="flex flex-col gap-2">
          <p class="text-xs text-muted">
            Rendering previews… {{ renderProgress }} / {{ file?.pageCount }}
          </p>
          <UProgress :model-value="renderProgress" :max="file?.pageCount || 1" size="sm" />
        </div>

        <ClientOnly>
          <draggable
            v-if="pages.length"
            v-model="pages"
            item-key="id"
            tag="ul"
            class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
          >
            <template #item="{ element, index }">
              <li class="group relative cursor-grab rounded-lg border border-default p-2 transition-colors hover:border-inverted/25">
                <img
                  :src="element.thumb"
                  :alt="`Page ${element.originalIndex + 1}`"
                  class="w-full rounded border border-default bg-white"
                  draggable="false"
                >
                <span class="mt-1.5 block text-center text-xs text-muted">
                  {{ index + 1 }}
                  <span v-if="element.originalIndex !== index" class="text-dimmed">(was {{ element.originalIndex + 1 }})</span>
                </span>
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="solid"
                  size="xs"
                  class="absolute -right-2 -top-2 rounded-full lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  :aria-label="`Delete page ${element.originalIndex + 1}`"
                  @click="removePage(element.id)"
                />
              </li>
            </template>
          </draggable>
        </ClientOnly>

        <div v-if="pages.length" class="flex flex-col gap-2">
          <UButton
            label="Save PDF"
            icon="i-lucide-download"
            size="lg"
            block
            :disabled="!changed"
            :loading="saving"
            @click="save"
          />
          <p class="text-center text-xs text-muted">
            {{ changed ? `${pages.length} of ${file?.pageCount} pages, new order` : 'Drag a page or delete one to enable saving' }}
          </p>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
