import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/game-cruella-e-raya/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    environment: 'node',
    alias: {
      phaser: path.resolve(__dirname, 'tests/__mocks__/phaser.ts'),
    },
  },
})
