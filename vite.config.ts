import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/customer-review-summarizer/',
  plugins: [react()],
  build: {
    rollupOptions: {
      // These are managed by the import map in index.html, so we don't bundle them.
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        '@google/genai'
      ]
    }
  }
})