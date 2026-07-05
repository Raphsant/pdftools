<script setup lang="ts">
import draggable from 'vuedraggable'
import type { ConvertOptions, LoadedImage } from '~/utils/convert'

const toast = useToast()
const { recordExport } = useTipJar()

const images = ref<LoadedImage[]>([])
const errors = ref<string[]>([])
const loadingCount = ref(0)
const converting = ref(false)
const progress = ref(0)
const progressMax = ref(0)

const options = reactive<ConvertOptions>({ pageSize: 'fit', margin: 10 })
const output = ref<'combined' | 'zip'>('combined')

const totalSize = computed(() => images.value.reduce((n, i) => n + i.size, 0))
const bigBatch = computed(() => images.value.length > 40 || totalSize.value > 300 * 1024 * 1024)

const ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif'
const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif', '.heic', '.heif']

async function addFiles(picked: File[]) {
  errors.value = []
  loadingCount.value += picked.length
  for (const file of picked) {
    try {
      images.value.push(await loadImage(file))
    }
    catch (error) {
      errors.value.push(error instanceof ImageLoadError ? error.message : `Couldn't read ${file.name}`)
    }
    finally {
      loadingCount.value--
    }
  }
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= images.value.length) return
  const item = images.value.splice(index, 1)[0]!
  images.value.splice(target, 0, item)
}

function remove(id: string) {
  images.value = images.value.filter(i => i.id !== id)
}

async function convert() {
  if (!images.value.length || converting.value || loadingCount.value > 0) return
  converting.value = true
  progress.value = 0
  errors.value = []
  try {
    const plain = images.value.map(i => toRaw(i))
    progressMax.value = plain.length
    const onProgress = (done: number) => { progress.value = done }
    if (output.value === 'zip' && plain.length > 1) {
      const { blob, failed } = await imagesToZip(plain, { ...options }, onProgress)
      saveBlob(blob, 'images-to-pdf.zip')
      notify(plain.length - failed.length, failed)
    }
    else {
      const { blob, failed } = await imagesToPdf(plain, { ...options }, onProgress)
      saveBlob(blob, 'images.pdf')
      notify(plain.length - failed.length, failed)
    }
    recordExport()
  }
  catch (error) {
    if (error instanceof ConversionError) {
      errors.value = error.failed.map(f => `${f.name} couldn't be converted`)
    }
    toast.add({ title: 'Something went wrong while converting', icon: 'i-lucide-triangle-alert', color: 'error' })
  }
  finally {
    converting.value = false
  }
}

function notify(ok: number, failed: LoadedImage[]) {
  if (failed.length) {
    errors.value = failed.map(f => `${f.name} couldn't be converted — it was left out`)
  }
  toast.add({
    title: `Converted ${ok} image${ok === 1 ? '' : 's'} to PDF`,
    icon: failed.length ? 'i-lucide-triangle-alert' : 'i-lucide-circle-check',
    color: failed.length ? 'warning' : 'success',
    duration: 2500,
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PdfDropzone
      multiple
      :accept="ACCEPT"
      :extensions="EXTENSIONS"
      label="Drop images here, or tap to browse"
      hint="JPG, PNG, WebP, HEIC, GIF, BMP, AVIF"
      @files="addFiles"
    />

    <p v-if="loadingCount" class="flex items-center gap-1.5 text-xs text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-3.5 shrink-0 animate-spin" />
      Reading {{ loadingCount }} image{{ loadingCount === 1 ? '' : 's' }}…
    </p>

    <ul v-if="errors.length" class="flex flex-col gap-1">
      <li v-for="(error, i) in errors" :key="i" class="flex items-center gap-1.5 text-xs text-warning">
        <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
        {{ error }}
      </li>
    </ul>

    <p v-if="bigBatch" class="flex items-center gap-1.5 text-xs text-warning">
      <UIcon name="i-lucide-triangle-alert" class="size-3.5 shrink-0" />
      Large batch — on phones, try smaller groups.
    </p>

    <ClientOnly>
      <draggable
        v-if="images.length"
        v-model="images"
        item-key="id"
        handle=".drag-handle"
        tag="ul"
        class="flex flex-col gap-2"
      >
        <template #item="{ element, index }">
          <li class="flex min-h-14 items-center gap-2 rounded-lg border border-default px-3 py-2">
            <UIcon name="i-lucide-grip-vertical" class="drag-handle size-4 shrink-0 cursor-grab text-dimmed" />
            <img
              :src="element.thumb"
              alt=""
              class="size-8 shrink-0 rounded border border-default bg-white object-cover"
              draggable="false"
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm text-highlighted">{{ element.name }}</span>
              <span class="block text-xs text-muted">
                {{ element.width }} × {{ element.height }} · {{ formatBytes(element.size) }}
                <span class="uppercase text-dimmed">· {{ element.kind }}</span>
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
              :disabled="index === images.length - 1"
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

    <template v-if="images.length">
      <section class="flex flex-col gap-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">
          Page setup
        </h2>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="size in ([['fit', 'Fit to image'], ['a4', 'A4'], ['letter', 'US Letter']] as const)"
            :key="size[0]"
            type="button"
            class="flex min-h-11 items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
            :class="options.pageSize === size[0]
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-default text-toned hover:bg-elevated'"
            @click="options.pageSize = size[0]"
          >
            {{ size[1] }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">Margin</span>
          <UButton
            v-for="m in ([[0, 'None'], [10, '10 mm']] as const)"
            :key="m[0]"
            :label="m[1]"
            color="neutral"
            :variant="options.margin === m[0] ? 'solid' : 'subtle'"
            size="xs"
            @click="options.margin = m[0]"
          />
        </div>
      </section>

      <section v-if="images.length > 1" class="flex flex-col gap-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">
          Output
        </h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="out in ([['combined', 'One combined PDF', 'i-lucide-file-text'], ['zip', 'One PDF per image (ZIP)', 'i-lucide-package']] as const)"
            :key="out[0]"
            type="button"
            class="flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
            :class="output === out[0]
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-default text-toned hover:bg-elevated'"
            @click="output = out[0]"
          >
            <UIcon :name="out[2]" class="size-4 shrink-0" />
            {{ out[1] }}
          </button>
        </div>
      </section>

      <div class="flex flex-col gap-2">
        <UButton
          :label="`Convert ${images.length} image${images.length === 1 ? '' : 's'} to PDF`"
          icon="i-lucide-file-output"
          size="lg"
          block
          :disabled="loadingCount > 0"
          :loading="converting"
          @click="convert"
        />
        <UProgress v-if="converting" :model-value="progress" :max="progressMax" size="sm" />
        <p class="text-center text-xs text-muted">
          {{ formatBytes(totalSize) }} total · converted on your device
        </p>
      </div>
    </template>
  </div>
</template>
