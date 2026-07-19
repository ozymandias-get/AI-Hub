import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { main: 'src/main/main.ts' },
    format: ['cjs'],
    target: 'node18',
    outDir: 'dist/main',
    clean: false,
    external: ['electron'],
    sourcemap: false,
    minify: true,
    treeshake: true,
  },
  {
    entry: { preload: 'src/preload/preload.ts' },
    format: ['cjs'],
    target: 'node18',
    outDir: 'dist/preload',
    clean: false,
    external: ['electron'],
    sourcemap: false,
    minify: true,
    treeshake: true,
  },
]);
