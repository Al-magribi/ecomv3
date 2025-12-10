import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = Router();
const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- HELPER: Fungsi untuk Parse CSV dan Batch Insert ---
async function importCsvData(client, filePath, tableName, columns) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File CSV tidak ditemukan: ${filePath}`);
      return;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    // Split baris, filter baris kosong
    const rows = fileContent
      .trim()
      .split("\n")
      .filter((r) => r.trim() !== "");

    // Batch size untuk menghindari limit parameter PostgreSQL (biasanya max 65535 param)
    // Kita set 500 baris per insert agar aman
    const batchSize = 500;

    console.log(`Processing ${tableName}: ${rows.length} rows...`);

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      let placeholders = [];
      let values = [];
      let counter = 1;

      batch.forEach((row) => {
        // Asumsi CSV delimiter adalah koma (,) atau titik koma (;) sesuaikan dengan file Anda
        // Kita gunakan regex sederhana untuk split, menghapus quote " jika ada
        const cols = row
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((val) => val.trim().replace(/^"|"$/g, ""));

        // Buat placeholder ($1, $2), ($3, $4), dst
        const rowPlaceholders = [];
        for (let j = 0; j < columns.length; j++) {
          rowPlaceholders.push(`$${counter++}`);
          values.push(cols[j]);
        }
        placeholders.push(`(${rowPlaceholders.join(",")})`);
      });

      if (placeholders.length > 0) {
        const query = `INSERT INTO ${tableName} (${columns.join(
          ","
        )}) VALUES ${placeholders.join(",")} ON CONFLICT DO NOTHING`;
        await client.query(query, values);
      }
    }
    console.log(`✅ Success import ${tableName}`);
  } catch (error) {
    console.error(`❌ Error importing ${tableName}:`, error.message);
    throw error;
  }
}

// --- 1. Endpoint Test Koneksi Database ---
router.post("/test-db", async (req, res) => {
  const { host, port, user, password, database } = req.body;

  const client = new Client({ user, host, database, password, port });

  try {
    await client.connect();
    await client.query("SELECT NOW()");
    await client.end(); // Tutup jika berhasil
    return res.status(200).json({ message: "Koneksi Berhasil!" });
  } catch (error) {
    // PENTING: Pastikan client ditutup meskipun error, agar tidak hang
    try {
      await client.end();
    } catch (e) {}

    return res
      .status(400)
      .json({ message: "Gagal terhubung: " + error.message });
  }
});

// --- 2. Endpoint Finish Install ---
router.post("/finish", async (req, res) => {
  const data = req.body;
  const {
    db_host,
    db_port,
    db_user,
    db_pass,
    db_name,
    admin_name,
    admin_email,
    admin_pass,
    store_name,
    app_domain,
    shipping_origin,
    rajaongkir_key,
    midtrans_server,
    midtrans_client,
    midtrans_base_url, // <--- TAMBAHKAN INI
    midtrans_is_production,
    smtp_user,
    smtp_pass,
    install_dummy,
  } = data;

  const client = new Client({
    user: db_user,
    host: db_host,
    database: db_name,
    password: db_pass,
    port: db_port,
  });

  try {
    // A. Koneksi
    await client.connect();

    // B. Jalankan Tables.sql (Create Table & Seed Courier/Dummy Products)
    // File Tables.sql ada di root folder server
    const sqlPath = path.resolve(__dirname, "../../../Tables.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    await client.query(sqlContent);

    // C. Import Wilayah (CSV)
    // Penting: Hapus dulu data wilayah dummy bawaan Tables.sql agar tidak duplikat/error
    console.log("--- Menghapus data wilayah dummy & memulai import CSV ---");
    await client.query(
      "TRUNCATE TABLE villages, districts, regencies, provinces CASCADE;"
    );

    // Lokasi file CSV di folder server/config/
    const configDir = path.resolve(__dirname, "../../config");

    // Urutan Import Wajib: Provinsi -> Kota -> Kecamatan -> Desa (Parent dulu baru Child)
    await importCsvData(
      client,
      path.join(configDir, "backup_provinsi.csv"),
      "provinces",
      ["id", "name"]
    );
    await importCsvData(
      client,
      path.join(configDir, "backup_kota.csv"),
      "regencies",
      ["id", "province_id", "name"]
    );
    await importCsvData(
      client,
      path.join(configDir, "backup_kecamatan.csv"),
      "districts",
      ["id", "regency_id", "name"]
    );
    // Desa paling banyak, butuh waktu sedikit lama
    await importCsvData(
      client,
      path.join(configDir, "backup_desa.csv"),
      "villages",
      ["id", "district_id", "name"]
    );

    // D. Pastikan Courier Ada (Jika di Tables.sql sudah ada, ini hanya safety check)
    // Tables.sql Anda sudah memiliki INSERT couriers, jadi kita skip atau pastikan saja
    // Jika ingin memastikan courier default aktif:
    await client.query("UPDATE couriers SET isactive = true");

    // E. Handle Data Dummy Produk/User
    if (!install_dummy) {
      // Jika user TIDAK mau dummy produk, kita hapus
      await client.query(
        "TRUNCATE TABLE order_items, orders, carts, reviews, product_variants, images, products RESTART IDENTITY CASCADE;"
      );
      await client.query("DELETE FROM users;");
    } else {
      // Hapus admin dummy bawaan SQL agar tidak konflik dengan admin baru
      await client.query("DELETE FROM users WHERE role = 'admin';");
    }

    // F. Buat Admin Baru (Real)
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(admin_pass, salt);
    await client.query(
      `INSERT INTO users (name, email, password, is_active, role) VALUES ($1, $2, $3, true, 'admin')`,
      [admin_name, admin_email, hashPassword]
    );

    // G. Update Konfigurasi Toko
    const updates = [
      { key: "store_name", val: store_name },
      { key: "domain", val: app_domain },
      { key: "shipping_origin", val: shipping_origin },
      { key: "shipping_api", val: rajaongkir_key },

      // --- Update Bagian Midtrans ---
      { key: "midtrans_server_key", val: midtrans_server },
      { key: "midtrans_client_key", val: midtrans_client },
      { key: "midtrans_base_url", val: midtrans_base_url }, // <--- BARU
      { key: "midtrans_is_production", val: midtrans_is_production }, // <--- BARU
      // ------------------------------

      { key: "smtp_user", val: smtp_user },
      { key: "smtp_pass", val: smtp_pass },
      { key: "smtp_from_email", val: smtp_user },
      { key: "smtp_port", val: 465 },
    ];
    for (const item of updates) {
      if (item.val) {
        await client.query(
          `INSERT INTO configurations (key, value, category) 
                 VALUES ($1, $2, 'general') 
                 ON CONFLICT (key) DO UPDATE SET value = $2`,
          [item.key, item.val]
        );
      }
    }

    await client.end();

    // H. Generate .env
    const envContent = `PORT=2090
JWT_SECRET=${crypto.randomBytes(32).toString("hex")}
MODE=production
# Database Config
P_USER=${db_user}
P_HOST=${db_host}
P_DB=${db_name}
P_PASSWORD=${db_pass}
# App Domain
DOMAIN=${app_domain}
LOCAL=http://localhost:5173
`;

    fs.writeFileSync(path.resolve(__dirname, "../../../.env"), envContent);

    res
      .status(200)
      .json({ success: true, message: "Instalasi & Import Data Berhasil" });

    // I. Auto Restart
    setTimeout(() => {
      console.log("Instalasi selesai. Memicu restart server...");

      // Trik: Kita "sentuh" file ini sendiri.
      // Mengupdate waktu modifikasi file akan memaksa Nodemon merestart server
      // seolah-olah Anda baru saja menekan Ctrl+S.
      const now = new Date();
      fs.utimesSync(__filename, now, now);
    }, 1500);
  } catch (error) {
    console.error("Installation Error:", error);
    if (client) await client.end();
    res.status(500).json({ message: "Error: " + error.message });
  }
});

export default router;
