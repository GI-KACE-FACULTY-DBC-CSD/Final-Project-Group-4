import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer .tsx/.ts over .js so updated TSX is used when both existed
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    host: true,
    // Set VITE_HTTPS=true for iPhone (e.g. PowerShell: $env:VITE_HTTPS='true'; npm run dev)
    https: process.env.VITE_HTTPS === 'true',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
