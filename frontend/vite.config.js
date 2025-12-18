import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，确保在Vercel上能正确加载
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
