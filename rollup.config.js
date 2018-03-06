import typescript from "rollup-plugin-typescript2";
import cjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";

export default {
    input: "./src/main.ts",
    output: {
        file: "build/bundle.js",
        format: "iife"
    },
    plugins: [resolve(), cjs(), typescript()],
    sourcemap: true
};
