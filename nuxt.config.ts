// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Expose public environment variables to both client and server
    public: {
      API_URL: process.env.API_URL || 'https://kollelsys.com',
    },
  },
})
