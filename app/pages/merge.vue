<script setup lang="ts">
import draggable from 'vuedraggable'
import type { LoadedPdf } from '~/utils/pdf'

const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: 'Merge PDFs free — Snuuy PDFTools',
  description: 'Combine PDF files into one, in any order — free, no sign-up, and your files never leave your device.',
  ogTitle: 'Merge PDFs free — Snuuy PDFTools',
  ogDescription: 'Combine PDFs into one, right in your browser. Nothing gets uploaded.',
  ogType: 'website',
  ogUrl: `${siteUrl}/merge`,
  ogImage: `${siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og.png`,
})

useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/merge` }] })

const toast = useToast()
const { recordExport } = useTipJar()

const files = ref<LoadedPdf[]>([])
const errors = ref<string[]>([])
const merging = ref(false)

const totalPages = computed(() => files.value.reduce((n, f) => n + f.pageCount, 0))
const totalSize = computed(() => files.value.reduce((n, f) => n + f.size, 0))

async function addFiles(picked: File[]) {
  errors.value = []
  for (const file of picked) {
    try {
      files.value.push(await loadPdf(file))
    }
    catch (error) {
      errors.value.push(error instanceof PdfLoadError ? error.message : `Couldn't read ${file.name}`)
    }
  }
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= files.value.length) return
  const item = files.value.splice(index, 1)[0]!
  files.value.splice(target, 0, item)
}

function remove(id: string) {
  files.value = files.value.filter(f => f.id !== id)
}

async function merge() {
  if (files.value.length < 2 || merging.value) return
  merging.value = true
  try {
    saveBlob(await mergePdfs(files.value), 'merged.pdf')
    toast.add({
      title: `Merged ${files.value.length} files · ${totalPages.value} pages`,
      icon: 'i-lucide-circle-check',
      color: 'success',
      duration: 2500,
    })
    recordExport()
  }
  catch {
    toast.add({ title: 'Something went wrong while merging', icon: 'i-lucide-triangle-alert', color: 'error' })
  }
  finally {
    merging.value = false
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
            Merge PDFs
          </h1>
          <p class="mt-1 text-sm text-muted">
            Combine files into one PDF — drag to set the order. Everything happens on your device.
          </p>
        </div>

        <PdfDropzone multiple hint="Add as many as you like" @files="addFiles" />

        <ul v-if="errors.length" class="flex flex-col gap-1">
          <li v-for="(error, i) in errors" :key="i" class="flex items-center gap-1.5 text-xs text-warning">
            <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
            {{ error }}
          </li>
        </ul>

        <ClientOnly>
          <draggable
            v-if="files.length"
            v-model="files"
            item-key="id"
            handle=".drag-handle"
            tag="ul"
            class="flex flex-col gap-2"
          >
            <template #item="{ element, index }">
              <li class="flex min-h-14 items-center gap-2 rounded-lg border border-default px-3 py-2">
                <UIcon name="i-lucide-grip-vertical" class="drag-handle size-4 shrink-0 cursor-grab text-dimmed" />
                <span class="grid size-8 shrink-0 place-items-center rounded-md bg-elevated text-xs font-medium text-toned">
                  {{ index + 1 }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm text-highlighted">{{ element.name }}</span>
                  <span class="block text-xs text-muted">
                    {{ element.pageCount }} page{{ element.pageCount === 1 ? '' : 's' }} · {{ formatBytes(element.size) }}
                  </span>
                </span>
                <UButton
                  icon="i-lucide-chevron-up"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :disabled="index === 0"
                  :aria-label="`Move ${element.name} up`"
                  @click="move(index, -1)"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :disabled="index === files.length - 1"
                  :aria-label="`Move ${element.name} down`"
                  @click="move(index, 1)"
                />
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :aria-label="`Remove ${element.name}`"
                  @click="remove(element.id)"
                />
              </li>
            </template>
          </draggable>
        </ClientOnly>

        <div v-if="files.length" class="flex flex-col gap-2">
          <UButton
            :label="files.length < 2 ? 'Add at least one more file' : `Merge ${files.length} files`"
            icon="i-lucide-combine"
            size="lg"
            block
            :disabled="files.length < 2"
            :loading="merging"
            @click="merge"
          />
          <p class="text-center text-xs text-muted">
            {{ totalPages }} pages · {{ formatBytes(totalSize) }} total
          </p>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
