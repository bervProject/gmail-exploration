import typescript from '@rollup/plugin-typescript';
import { terser } from "rollup-plugin-terser";

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        typescript({ module: 'esnext' }),
        terser()
    ],
};