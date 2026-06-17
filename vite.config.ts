import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Service Worker: caching aset statis + runtime caching untuk GET dropdown options.
// POST endpoint analitik tidak ikut di-cache SW (di-cache oleh TanStack Query di memori).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'ethos_logo.png', 'ethos_logo_2.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/options'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-options',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 10 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/geo/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'geo-assets',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'Ethos Analytics MP',
        short_name: 'EthosMP',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: '/ethos_logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/ethos_logo.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Vendor chunk splitting: pisahkan lib berat agar bisa di-cache lebih lama.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', 'zustand'],
          echarts: ['echarts', 'echarts-for-react'],
        },
      },
    },
  },
});
