import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Base URL default adalah '/' yang artinya relative ke domain saat ini.
  // Ini memungkinkan aplikasi berjalan di domain apapun tanpa config hardcoded.
  base: "/",
  server: {
    // Proxy hanya aktif saat mode development (npm run dev)
    // Saat production (dist), Express yang akan menangani routing ini.
    proxy: {
      "/api": {
        target: "http://localhost:2090", // Arahkan ke port backend lokal
        changeOrigin: true,
        secure: false,
      },
      "/assets": {
        target: "http://localhost:2090",
        changeOrigin: true,
        secure: false,
      },
      "/temp_backup": {
        target: "http://localhost:2090",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Optimasi build
    sourcemap: false, // Matikan sourcemap di prod agar lebih ringan & aman
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@reduxjs/toolkit",
          ],
        },
      },
    },
  },
});
