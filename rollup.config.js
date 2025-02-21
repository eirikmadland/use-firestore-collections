// rollup.config.js

import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default [
  // ES module build (for bundlers)
  {
    input: 'src/index.js', // Entry point of your composable
    output: {
      file: 'dist/index.es.js',
      format: 'es', // ES module format
      sourcemap: true
    },
    plugins: [resolve(), commonjs()],
    // Mark peer dependencies as external to avoid bundling them
    external: ['vue', 'firebase']
  },
  // UMD build (for direct script inclusion)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'umd', // UMD format for browsers
      name: 'useFirestoreCollections', // Global variable name for the UMD build
      sourcemap: true,
      globals: {
        vue: 'Vue',
        firebase: 'firebase'
      }
    },
    plugins: [resolve(), commonjs(), terser()],
    external: ['vue', 'firebase']
  }
]