import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utils/define-deck.ts',
    'src/utils/slide.ts',
    'src/services/deck-service.ts',
    'src/services/theme-service.ts',
    'src/atoms/deck-atom.ts',
    'src/atoms/clicks-atom.ts',
    'src/hooks/use-deck.ts',
    'src/hooks/use-clicks.ts',
    'src/hooks/use-navigation.ts',
    'src/errors/index.ts',
  ],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  shims: false,
  external: [/@mnestia/],
})
