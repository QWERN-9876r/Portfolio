import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
