<script setup lang="ts">
const route = useRoute()

// the four format routes all render the Convert tool
const isActive = (to: string) =>
  to === '/image-to-pdf' ? route.path.endsWith('-to-pdf') : route.path === to

const tools = [
  { label: 'Merge', to: '/merge', icon: 'i-lucide-combine' },
  { label: 'Split', to: '/split', icon: 'i-lucide-scissors' },
  { label: 'Reorder', to: '/reorder', icon: 'i-lucide-layout-grid' },
  { label: 'Convert', to: '/image-to-pdf', icon: 'i-lucide-image' },
]
</script>

<template>
  <header class="border-b border-default">
    <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <div class="grid size-7 place-items-center rounded-md bg-primary">
          <UIcon name="i-lucide-file-text" class="size-4 text-inverted" />
        </div>
        <span class="text-sm font-semibold text-highlighted max-[420px]:hidden">Snuuy - PDFTools</span>
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
          class="max-sm:hidden"
          :class="isActive(tool.to) ? 'text-primary' : ''"
        />
        <UButton
          v-for="tool in tools"
          :key="`icon-${tool.to}`"
          :icon="tool.icon"
          :to="tool.to"
          :aria-label="tool.label"
          color="neutral"
          variant="ghost"
          size="sm"
          class="sm:hidden"
          :class="isActive(tool.to) ? 'text-primary' : ''"
        />
      </nav>
    </div>
  </header>
</template>
