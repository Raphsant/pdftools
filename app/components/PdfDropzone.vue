<script setup lang="ts">
const props = defineProps<{
  multiple?: boolean
  hint?: string
}>()

const emit = defineEmits<{ files: [files: File[]] }>()

const input = ref<HTMLInputElement>()
const dragging = ref(false)

function accept(list: FileList | null | undefined) {
  if (!list) return
  const files = [...list].filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
  if (files.length) emit('files', props.multiple ? files : files.slice(0, 1))
}

function onDrop(event: DragEvent) {
  dragging.value = false
  accept(event.dataTransfer?.files)
}

function onPick(event: Event) {
  accept((event.target as HTMLInputElement).files)
  ;(event.target as HTMLInputElement).value = ''
}
</script>

<template>
  <button
    type="button"
    class="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors"
    :class="dragging ? 'border-primary bg-primary/5' : 'border-accented hover:border-inverted/25 hover:bg-elevated/50'"
    @click="input?.click()"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <UIcon name="i-lucide-file-plus-2" class="size-8 text-dimmed" />
    <span class="text-sm text-toned">
      {{ multiple ? 'Drop PDFs here, or tap to browse' : 'Drop a PDF here, or tap to browse' }}
    </span>
    <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
    <input
      ref="input"
      type="file"
      accept="application/pdf,.pdf"
      :multiple="multiple"
      class="hidden"
      @change="onPick"
    >
  </button>
</template>
