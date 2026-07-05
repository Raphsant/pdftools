<script setup lang="ts">
const props = defineProps<{ slug: string }>()

const cfg = computed(() => CONVERT_PAGES[props.slug]!)
const related = computed(() => Object.values(CONVERT_PAGES).filter(p => p.path !== cfg.value.path))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-default">
    <AppHeader />

    <main class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:py-12">
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-lg font-semibold text-highlighted">
            {{ cfg.h1 }}
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{ cfg.intro }}
          </p>
        </div>

        <ConvertToPdf />

        <section class="flex flex-col gap-3 border-t border-default pt-6">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">
            FAQ
          </h2>
          <div v-for="item in cfg.faq" :key="item.q">
            <h3 class="text-sm font-medium text-highlighted">
              {{ item.q }}
            </h3>
            <p class="mt-1 text-sm text-muted">
              {{ item.a }}
            </p>
          </div>
        </section>

        <p class="text-xs text-muted">
          Related:
          <template v-for="(page, i) in related" :key="page.path">
            <NuxtLink :to="page.path" class="text-toned underline-offset-2 hover:underline">{{ page.h1 }}</NuxtLink><template v-if="i < related.length - 1"> · </template>
          </template>
        </p>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
