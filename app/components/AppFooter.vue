<template>
  <footer class="border-t border-default">
    <div class="mx-auto flex min-h-12 max-w-5xl items-center justify-between gap-4 px-4 py-2 text-xs text-muted sm:px-6">
      <p>
        Free forever · files never leave your device ·
        <NuxtLink to="/jpg-to-pdf" class="transition-colors hover:text-highlighted">JPG to PDF</NuxtLink> ·
        <NuxtLink to="/png-to-pdf" class="transition-colors hover:text-highlighted">PNG</NuxtLink> ·
        <NuxtLink to="/heic-to-pdf" class="transition-colors hover:text-highlighted">HEIC</NuxtLink> ·
        <NuxtLink to="/webp-to-pdf" class="transition-colors hover:text-highlighted">WebP</NuxtLink> ·
        <a href="https://qr.snuuy.com" target="_blank" rel="noopener" class="transition-colors hover:text-highlighted">QRMaker</a>
      </p>
      <a
        :href="TIP_URL"
        target="_blank"
        rel="noopener"
        class="flex shrink-0 items-center gap-1.5 transition-colors hover:text-highlighted"
      >
        <UIcon name="i-lucide-coffee" class="size-3.5" />
        Tip jar
      </a>
    </div>
  </footer>
</template>
