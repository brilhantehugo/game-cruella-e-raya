import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-cruella-e-raya/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    environment: 'node',
  },
})
