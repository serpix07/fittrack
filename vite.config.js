import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // html5-qrcode ships WASM; exclude from pre-bundling so it loads correctly at runtime
    exclude: ['html5-qrcode'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase':     ['firebase/app', 'firebase/auth'],
          'charts':       ['recharts'],
        },
      },
    },
  },
})
