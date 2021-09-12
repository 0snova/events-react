import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

export default [
  {
    input: 'src/index.ts',
    external,
    output: [
      { file: pkg.main, format: 'cjs', inlineDynamicImports: true, exports: 'auto' },
      { file: pkg.module, format: 'es', inlineDynamicImports: true },
    ],
    plugins: [resolve({ extensions }), typescript()],
  },
];
