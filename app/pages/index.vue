<script setup lang="ts">
const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: 'Snuuy - PDFTools — free PDF tools, on your device',
  description: 'Merge, split, reorder and convert images to PDF for free — no sign-up, no upload. Your files are processed entirely in your browser.',
  ogTitle: 'Snuuy - PDFTools',
  ogDescription: 'Merge, split, reorder and convert images to PDF in your browser. Free forever, nothing gets uploaded.',
  ogType: 'website',
  ogUrl: `${siteUrl}/`,
  ogImage: `${siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
  twitterTitle: 'Snuuy - PDFTools',
  twitterDescription: 'Merge, split, reorder and convert images to PDF in your browser. Free forever, nothing gets uploaded.',
  twitterImage: `${siteUrl}/og.png`,
})

useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/` }] })

const tools = [
  {
    to: '/merge',
    icon: 'i-lucide-combine',
    title: 'Merge',
    description: 'Combine several PDFs into one, in any order.',
  },
  {
    to: '/split',
    icon: 'i-lucide-scissors',
    title: 'Split',
    description: 'Break a PDF into pages, or extract just a range.',
  },
  {
    to: '/reorder',
    icon: 'i-lucide-layout-grid',
    title: 'Reorder',
    description: 'Drag pages into a new order, delete the rest.',
  },
  {
    to: '/image-to-pdf',
    icon: 'i-lucide-image',
    title: 'Convert',
    description: 'Turn JPG, PNG, HEIC and WebP images into PDFs.',
  },
]
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <AppHeader />

    <main class="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:py-16">
      <div class="flex flex-col gap-10">
        <div class="max-w-xl">
          <h1 class="text-2xl font-semibold text-highlighted">
            PDF tools that don't want your files
          </h1>
          <p class="mt-2 text-sm text-muted">
            Merge, split, reorder and convert images to PDF entirely in your browser. Nothing is uploaded,
            nothing is watermarked, nothing costs money — your documents stay on your device.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.to"
            :to="tool.to"
            class="group flex flex-col gap-3 rounded-xl border border-default p-5 transition-colors hover:border-primary/50 hover:bg-elevated/50"
          >
            <div class="grid size-9 place-items-center rounded-lg bg-primary/10">
              <UIcon :name="tool.icon" class="size-4.5 text-primary" />
            </div>
            <div>
              <h2 class="flex items-center gap-1 text-sm font-semibold text-highlighted">
                {{ tool.title }}
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </h2>
              <p class="mt-1 text-xs text-muted">
                {{ tool.description }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <p class="text-xs text-dimmed">
          Works offline once loaded · No accounts · No file size games ·
          <a href="https://qr.snuuy.com" target="_blank" rel="noopener" class="underline-offset-2 hover:underline">
            also try Snuuy QRMaker
          </a>
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
