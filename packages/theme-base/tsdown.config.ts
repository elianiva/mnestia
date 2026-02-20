import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/setup.ts',
    'src/components/code-block.tsx',
    'src/components/image.tsx',
    'src/components/quote.tsx',
    'src/components/table.tsx',
    'src/layouts/default.tsx',
    'src/layouts/cover.tsx',
    'src/layouts/center.tsx',
    'src/layouts/split.tsx',
    'src/layouts/grid.tsx',
  ],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  shims: false,
  external: [/@mnestia/, 'react', 'react-dom'],
})
