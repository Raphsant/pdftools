<script setup lang="ts">
const cfg = CONVERT_PAGES.image!
const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: cfg.title,
  description: cfg.description,
  ogTitle: cfg.title,
  ogDescription: cfg.description,
  ogType: 'website',
  ogUrl: `${siteUrl}${cfg.path}`,
  ogImage: `${siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og.png`,
})

useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}${cfg.path}` }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': cfg.faq.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
      })),
    }),
  }],
})
</script>

<template>
  <ConvertPage slug="image" />
</template>
