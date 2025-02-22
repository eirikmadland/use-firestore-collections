import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
  // ES module build for bundlers.
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.es.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()],
    external: ['vue', 'firebase']
  },
  // UMD build for direct browser usage.
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'useFirestoreCollections',
      sourcemap: true,
      globals: {
        vue: 'Vue',
        firebase: 'firebase'
      }
    },
    plugins: [resolve(), commonjs(), terser()],
    external: ['vue', 'firebase']
  }
];