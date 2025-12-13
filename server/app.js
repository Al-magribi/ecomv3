// app.js
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

// Cek status Instalasi
const envPath = path.resolve(__dirname, "../.env");
const isInstalled = fs.existsSync(envPath);

console.log(
  `[SYSTEM] Mode: ${
    isInstalled ? "PRODUCTION (Toko Aktif)" : "INSTALLATION (Setup Wizard)"
  }`
);

if (!isInstalled) {
  // ==========================================
  // MODE 1: INSTALLER
  // ==========================================

  // Pastikan folder ini sesuai struktur folder Anda
  // Jika app.js ada di /server, maka installer ada di /server/installer
  const installerPath = path.join(__dirname, "installer");

  app.use("/api/install", RouterInstaller);
  app.use(express.static(installerPath)); // Serve static files installer (css/js)

  // Catch-all untuk installer
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(installerPath, "index.html"));
  });
} else {
  // ==========================================
  // MODE 2: PRODUCTION
  // ==========================================

  (async () => {
    try {
      // 1. LOAD DATABASE HANYA DI SINI
      // Menggunakan dynamic import agar tidak tereksekusi di mode Installer
      const { default: pool } = await import("./config/database.js");

      // Test koneksi sekilas (opsional)
      await pool.query("SELECT NOW()");
      console.log("[DB] Database Connected Successfully");

      // 2. Load Routers
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
      const { default: RouterReview } = await import(
        "./router/order/RouterReview.js"
      );
      const { default: RouterCart } = await import(
        "./router/cart/RouterCart.js"
      );
      const { default: RouterReport } = await import(
        "./router/report/RouterReport.js"
      );

      app.use("/assets", express.static(path.join(__dirname, "assets")));

      const backupPath = path.join(process.cwd(), "temp_backup");
      if (!fs.existsSync(backupPath))
        fs.mkdirSync(backupPath, { recursive: true });
      app.use("/temp_backup", express.static(backupPath));

      // Mount API Routes
      app.use("/api/config", RouterConfig);
      app.use("/api/auth", RouterAuth);
      app.use("/api/product", RouterProduct);
      app.use("/api/category", RouterCategory);
      app.use("/api/address", RouterAddress);
      app.use("/api/order", RouterOrder);
      app.use("/api/review", RouterReview);
      app.use("/api/cart", RouterCart);
      app.use("/api/report", RouterReport);

      // 3. Serve React Frontend
      const clientDistPath = path.resolve(__dirname, "../client/dist");

      if (fs.existsSync(clientDistPath)) {
        app.use(express.static(clientDistPath));

        // FIX: Gunakan '*' untuk Express 4/5 standard wildcard
        // Syntax `/{*splat}` biasanya untuk Fastify atau router library tertentu, bukan Express native.
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
