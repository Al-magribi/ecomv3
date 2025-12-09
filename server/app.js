//
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import fs from "fs";

// Router Installer (Selalu di-load)
import RouterInstaller from "./router/installer/RouterInstaller.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware Global
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cek status Instalasi berdasarkan keberadaan file .env di root project
// Asumsi: app.js ada di folder server/, jadi .env ada di satu level di atasnya (../.env)
const envPath = path.resolve(__dirname, "../.env");
const isInstalled = fs.existsSync(envPath);

console.log(
  `[SYSTEM] Mode: ${
    isInstalled ? "PRODUCTION (Toko Aktif)" : "INSTALLATION (Setup Wizard)"
  }`
);

if (!isInstalled) {
  // ==========================================
  // MODE 1: INSTALLER (Database Belum Setup)
  // ==========================================

  // 1. API Khusus Installer
  app.use("/api/install", RouterInstaller);

  // 2. Serve UI Installer (File HTML Wizard yang Anda buat sebelumnya)
  // Pastikan folder 'installer/public' ada dan berisi index.html
  app.use(express.static(path.join(__dirname, "installer/public")));

  // 3. Catch-all: Selalu tampilkan halaman installer jika user akses URL apapun
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "installer/index.html"));
  });
} else {
  // ==========================================
  // MODE 2: PRODUCTION (Toko Online Aktif)
  // ==========================================

  // Gunakan IIFE async untuk load router secara dinamis agar tidak crash saat DB belum connect
  (async () => {
    try {
      // Import Router Utama (Hanya di-load jika sudah install)
      // Menggunakan 'await import' mencegah error koneksi DB saat fase install
      const { default: RouterConfig } = await import(
        "./router/config/routerConfig.js"
      );
      const { default: RouterAuth } = await import(
        "./router/auth/RouterAuth.js"
      );
      const { default: RouterProduct } = await import(
        "./router/product/RouterProduct.js"
      );
      const { default: RouterCategory } = await import(
        "./router/product/RouterCategory.js"
      );
      const { default: RouterAddress } = await import(
        "./router/address/RouterAddress.js"
      );
      const { default: RouterOrder } = await import(
        "./router/order/RouterOrder.js"
      );
      const { default: RouterCart } = await import(
        "./router/cart/RouterCart.js"
      );
      const { default: RouterReport } = await import(
        "./router/report/RouterReport.js"
      );

      // Serve Static Assets (Gambar Upload)
      app.use("/assets", express.static(path.join(__dirname, "assets")));

      // Mount API Routes
      app.use("/api/config", RouterConfig);
      app.use("/api/auth", RouterAuth);
      app.use("/api/product", RouterProduct);
      app.use("/api/category", RouterCategory);
      app.use("/api/address", RouterAddress);
      app.use("/api/order", RouterOrder);
      app.use("/api/cart", RouterCart);
      app.use("/api/report", RouterReport);

      // Serve React Frontend (Hasil Build Vite)
      // Asumsi hasil build ada di folder client/dist atau sejajar di folder 'public'
      const clientDistPath = path.resolve(__dirname, "../client/dist");

      if (fs.existsSync(clientDistPath)) {
        app.use(express.static(clientDistPath));

        // React Router Handler (SPA)
        // Redirect semua request yg bukan API ke index.html React
        app.get("/{*splat}", (req, res) => {
          res.sendFile(path.join(clientDistPath, "index.html"));
        });
      } else {
        console.warn("⚠️ Folder build frontend (client/dist) tidak ditemukan.");
        app.get("/", (req, res) =>
          res.send("Server berjalan, tapi Frontend belum di-build.")
        );
      }
    } catch (error) {
      console.error("❌ Gagal memuat modul aplikasi:", error);
    }
  })();
}

export default app;
