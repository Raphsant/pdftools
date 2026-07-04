<script setup lang="ts">
const route = useRoute()

const tools = [
  { label: 'Merge', to: '/merge' },
  { label: 'Split', to: '/split' },
  { label: 'Reorder', to: '/reorder' },
]
</script>

<template>
  <header class="border-b border-default">
    <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <div class="grid size-7 place-items-center rounded-md bg-primary">
          <UIcon name="i-lucide-file-text" class="size-4 text-inverted" />
        </div>
        <span class="text-sm font-semibold text-highlighted">Snuuy - PDFTools</span>
      </NuxtLink>
      <nav class="flex items-center gap-1">
        <UButton
          v-for="tool in tools"
          :key="tool.to"
          :label="tool.label"
          :to="tool.to"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="route.path === tool.to ? 'text-primary' : ''"
        />
      </nav>
    </div>
  </header>
</template>
