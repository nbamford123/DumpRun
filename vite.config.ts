import { defineConfig } from 'vite'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import externals from 'rollup-plugin-node-externals'
import path from 'path'
import { globSync } from 'glob'

const lambdaEntries = globSync('src/lambda/**/index.ts').reduce((acc, file) => {
  const name: string = path.dirname(file).split(path.sep).pop() || ''
  acc[name] = file
  return acc
}, {})

export default defineConfig({
  build: {
    lib: {
      entry: lambdaEntries,
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      plugins: [
        nodeResolve({ preferBuiltins: true }),
        externals({ deps: true }),
      ],
      output: {
        entryFileNames: '[name]/index.js',
      },
    },
    target: 'es2020',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
