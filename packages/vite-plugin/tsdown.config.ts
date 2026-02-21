import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  shims: false,
  external: [/@mnestia/, 'vite', '@tailwindcss/vite'],
})
