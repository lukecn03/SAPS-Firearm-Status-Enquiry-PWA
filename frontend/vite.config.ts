import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const repoName = 'SAPS-Firearm-Status-Enquiry-PWA';
const base = process.env.VITE_BASE_PATH || `/${repoName}/`;

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'SAPS Firearm Status Enquiry',
        short_name: 'SAPS Firearm Status',
        description: 'Check your firearm application status with SAPS',
        theme_color: '#1B3838',
        background_color: '#ffffff',
        display: 'standalone',
        scope: base,
        start_url: base,
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      inlineRegister: 'inline',
      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
});
