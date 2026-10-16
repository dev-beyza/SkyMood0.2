import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'SkyMood Hava Durumu',
        short_name: 'SkyMood',
        description: 'Minimalist ve akıllı hava durumu uygulaması.',
        theme_color: '#e0e7ff', // Pastel mavi tema rengi
        background_color: '#0f172a', // Gece moduna uyumlu arka plan
        display: 'standalone', // Tarayıcı çubuğunu gizler, tam ekran yapar
        orientation: 'portrait', // Sadece dikey kullanım
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})