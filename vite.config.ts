import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

/** Project-pages base such as `/multiply-heroes/`. Unset locally, so dev stays at `/`. */
function pagesBase(value: string | undefined): string {
  if (!value || value === '/') return '/'
  const withLeading = value.startsWith('/') ? value : `/${value}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const base = pagesBase(process.env.VITE_BASE_PATH)

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Multiply Heroes',
        short_name: 'Multiply',
        description: 'Practice single-digit multiplication by battling a boss.',
        theme_color: '#b7e4ff',
        background_color: '#fff6df',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Absolute app path, not the domain root, so project pages (`/repo/`) can open offline.
        navigateFallback: `${base}index.html`,
        navigateFallbackAllowlist: [new RegExp(`^${escapeRegExp(base)}`)],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 43127,
    strictPort: true,
    allowedHosts: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
