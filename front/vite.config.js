import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import glsl from "vite-plugin-glsl";
import restart from "vite-plugin-restart";

export default defineConfig({
  root: "src/",
  publicDir: "../static/",
  base: "./",
  server: {
    host: true,
    open: false,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [vue(), glsl(), restart({ restart: ["../static/**"] })],
});
