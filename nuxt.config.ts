// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      // override with NUXT_PUBLIC_SITE_URL at deploy time if needed
      siteUrl: 'https://pdf.snuuy.com',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Snuuy - PDFTools',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Merge, split, reorder and convert images to PDF — free forever, processed on your device.' },
        { name: 'theme-color', content: '#ef4444' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
