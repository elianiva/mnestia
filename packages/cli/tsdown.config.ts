import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  shims: true,
  external: [/@mnestia/, 'vite', 'kleur', 'jiti'],
})
