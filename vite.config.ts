/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base: the build runs from any static host or sub-path.
// PWA: installable ("홈 화면에 추가"), full-screen standalone, works offline.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '12% — 새벽 2시, 해원고 전화부스 괴담',
        short_name: '12%',
        description: '비 오는 밤, 폐교 앞 전화부스에서 주운 휴대폰. 잠금을 풀면 모르는 번호가 말을 건다. “들어오세요.”',
        lang: 'ko',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Korean fonts ship as ~100 unicode-range slices: cache the ones the
        // game actually uses, on demand, instead of precaching all of them.
        // The app, its pictures and voices are installed up front (it works offline);
        // the clips (~5 MB) are cached the first time each one plays instead.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,avif,mp3}'],
        globIgnores: ['og.jpg'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\.(mp4|webm)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'clips', expiration: { maxEntries: 30 }, rangeRequests: true, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: ({ url }) => /\.woff2?$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  build: { target: 'es2020' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
