import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import babel from "vite-plugin-babel";

const ReactCompilerConfig = {
  target: "19",
};

export default defineConfig({
  plugins: [
    react(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
  ],
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
          framer: ["framer-motion"],
        },
      },
    },
  },
  server: {
    cors: {
      origin: ["https://storage.yandexcloud.net"],
      credentials: true,
    },
    proxy: {
      "/api/storage": {
        target: "https://storage.yandexcloud.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/storage/, "/qwern-9876r"),
      },
    },
  },
});
