import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import AdmZip from "adm-zip";
import { spawn } from "cross-spawn";
import { compressImage } from "../../utils/comporessImage.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ============================================================================
// 1. PUBLIC CONFIG (User)
// ============================================================================
router.get(
  "/get-mid-config",
  authorize("user"),
  withQuery(async (req, res, pool) => {
    const configQuery = `
        SELECT key, value 
        FROM configurations 
        WHERE key 
        IN ('midtrans_client_key', 'midtrans_base_url', 'midtrans_is_production')
      `;
    const configResult = await pool.query(configQuery);
    const configMap = configResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.status(200).json({
      clientKey: configMap["midtrans_client_key"],
      midtransBaseUrl: configMap["midtrans_base_url"],
    });
  })
);

// ============================================================================
// 2. GET ALL CONFIGS (Admin)
// ============================================================================
router.get(
  "/get-configs",
  authorize("admin"),
  withQuery(async (req, res, pool) => {
    // Mengambil semua konfigurasi, diurutkan berdasarkan kategori agar rapi di UI
    const result = await pool.query(
      "SELECT * FROM configurations ORDER BY category DESC, id ASC"
    );
    res.json(result.rows);
  })
);

// ============================================================================
// 3. SAVE CONFIGS (Admin) - Supports Text & File Upload
// ============================================================================
router.put(
  "/save-configs",
  authorize("admin"),
  upload.any(), // Handle multipart/form-data (Text & Files)
  withTransaction(async (req, res, client) => {
    // A. Handle Text Fields (req.body)
    // req.body berisi key-value pair: { "store_name": "Toserba Baru", ... }
    for (const [key, value] of Object.entries(req.body)) {
      // CONSTRAINT: Hanya update jika KEY sudah ada di database.
      // Tidak ada INSERT, sehingga Admin tidak bisa menambah konfigurasi liar.
      await client.query(
        "UPDATE configurations SET value = $1, updated_at = NOW() WHERE key = $2",
        [value, key]
      );
    }

    // B. Handle Files (req.files) - untuk Logo/Favicon
    if (req.files && req.files.length > 0) {
      const targetDir = path.join(process.cwd(), "server/assets/shop");

      // Buat folder jika belum ada
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const file of req.files) {
        const key = file.fieldname;

        // 1. Validasi & AMBIL DATA LAMA:
        // Kita perlu select 'value' juga untuk tahu path file lama
        const check = await client.query(
          "SELECT id, value FROM configurations WHERE key = $1 AND type = 'image'",
          [key]
        );

        if (check.rows.length > 0) {
          // --- LOGIKA HAPUS FILE LAMA (BARU DITAMBAHKAN) ---
          const oldDbPath = check.rows[0].value; // Contoh: /assets/shop/logo_123.png

          if (oldDbPath) {
            // Konversi URL path database ke System path
            // Asumsi struktur: process.cwd() + /server + /assets/shop/...
            const oldFilePath = path.join(process.cwd(), "server", oldDbPath);

            try {
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath); // Hapus file fisik lama
              }
            } catch (err) {
              console.error(`Gagal menghapus file lama (${oldFilePath}):`, err);
              // Lanjut saja, jangan throw error agar proses update tetap jalan
            }
          }
          // ---------------------------------------------------

          // 2. Proses Simpan File BARU
          const ext = path.extname(file.originalname).toLowerCase();
          const filename = `${key}_${Date.now()}${ext}`;
          const outputPath = path.join(targetDir, filename);
          const dbLink = `/assets/shop/${filename}`;

          // Kompres jika gambar, simpan biasa jika ico/svg
          if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
            // Pastikan fungsi compressImage sudah tersedia/diimport
            await compressImage(file.buffer, outputPath);
          } else {
            fs.writeFileSync(outputPath, file.buffer);
          }

          // 3. Update Database Path dengan file baru
          await client.query(
            "UPDATE configurations SET value = $1, updated_at = NOW() WHERE key = $2",
            [dbLink, key]
          );
        }
      }
    }

    res.json({ message: "Konfigurasi berhasil diperbarui" });
  })
);

// ============================================================================
// 4. LOGO & FAVICON
// ============================================================================
router.get(
  "/get-store",
  withQuery(async (req, res, pool) => {
    const configQuery = `
        SELECT key, value 
        FROM configurations 
        WHERE key 
        IN ('store_logo', 'store_favicon', 'store_name')
      `;
    const configResult = await pool.query(configQuery);
    const configMap = configResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.status(200).json({
      logo: configMap["store_logo"],
      favicon: configMap["store_favicon"],
      name: configMap["store_name"],
    });
  })
);

router.get(
  "/check-address",
  withQuery(async (req, res, pool) => {
    const admin = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    const adminId = admin.rows[0].id;

    const adminAddress = await pool.query(
      "SELECT * FROM addresses WHERE user_id = $1 AND is_primary = true",
      [adminId]
    );

    if (adminAddress.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Pengaturan alamat toko belum diatur" });
    }

    res.status(200);
  })
);

// ============================================================================
// 5. DATABASE MANAGEMENT
// ============================================================================

// ============================================================================
// HELPER: Auto-Detect Command Path (Logika IF-ELSE)
// ============================================================================
const getCommandPath = (toolName) => {
  // Path spesifik server aaPanel/Linux Anda
  const serverBinPath = `/www/server/pgsql/bin/${toolName}`;

  // Logika IF ELSE:
  // Jika file spesifik di server ada, pakai itu. Jika tidak, pakai command global.
  if (fs.existsSync(serverBinPath)) {
    return serverBinPath;
  } else {
    // Fallback untuk Windows Localhost (asumsi sudah di PATH environment)
    return toolName;
  }
};

router.get("/backup", authorize("admin"), async (req, res) => {
  const tempDir = path.join(process.cwd(), "temp_backup");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sqlFileName = `db_dump_${timestamp}.sql`;
  const sqlFilePath = path.join(tempDir, sqlFileName);
  const zipFileName = `backup_${timestamp}.zip`;

  // DETEKSI COMMAND (pg_dump)
  const PG_DUMP_CMD = getCommandPath("pg_dump");

  try {
    console.log(`[BACKUP] Menggunakan command: ${PG_DUMP_CMD}`);

    const pgEnv = { ...process.env, PGPASSWORD: process.env.P_PASSWORD };

    // --- PROSES DUMP ---
    await new Promise((resolve, reject) => {
      const dumpProcess = spawn(
        PG_DUMP_CMD,
        [
          "-h",
          process.env.P_HOST || "localhost",
          "-p",
          process.env.P_PORT || "5432",
          "-U",
          process.env.P_USER,
          "--clean", // Drop table dulu
          "--if-exists",
          "--format=p", // Plain text SQL
          "--file",
          sqlFilePath,
          process.env.P_DB,
        ],
        { env: pgEnv }
      );

      dumpProcess.stderr.on("data", (data) =>
        console.log(`pg_dump log: ${data}`)
      );

      dumpProcess.on("error", (err) => {
        reject(new Error(`Gagal spawn ${PG_DUMP_CMD}. Error: ${err.message}`));
      });

      dumpProcess.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pg_dump exited with code ${code}`));
      });
    });

    // --- PROSES ZIP ---
    const archive = archiver("zip", { zlib: { level: 9 } });
    res.attachment(zipFileName);
    archive.pipe(res);

    archive.file(sqlFilePath, { name: "database.sql" });

    const assetsPath = path.join(process.cwd(), "server/assets");
    if (fs.existsSync(assetsPath)) {
      archive.directory(assetsPath, "assets");
    }

    await archive.finalize();

    // Cleanup
    res.on("finish", () => {
      try {
        if (fs.existsSync(sqlFilePath)) fs.unlinkSync(sqlFilePath);
      } catch (e) {}
    });
  } catch (error) {
    console.error("[BACKUP ERROR]", error);
    if (fs.existsSync(sqlFilePath)) fs.unlinkSync(sqlFilePath);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
});

router.post(
  "/restore",
  authorize("admin"),
  upload.single("backupFile"),
  async (req, res) => {
    // Cek req.file.buffer karena kita pakai memoryStorage
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ message: "No file uploaded or file is empty" });
    }

    // Kita tetap butuh folder temp untuk mengekstrak isi ZIP (SQL + Assets)
    const tempDir = path.join(process.cwd(), "temp_restore_" + Date.now());
    const PSQL_CMD = getCommandPath("psql");

    try {
      // 1. Load ZIP dari Buffer (Memory)
      const zip = new AdmZip(req.file.buffer);

      // 2. Extract isi ZIP ke folder temp di disk
      // Ini diperlukan karena psql butuh path file .sql dan kita perlu mindahin folder assets
      zip.extractAllTo(tempDir, true);

      // 3. Restore Assets (Folder Gambar)
      const sourceAssets = path.join(tempDir, "assets");
      const destAssets = path.join(process.cwd(), "server/assets");

      if (fs.existsSync(sourceAssets)) {
        if (fs.existsSync(destAssets)) {
          fs.rmSync(destAssets, { recursive: true, force: true }); // Hapus assets lama
        }
        fs.renameSync(sourceAssets, destAssets); // Pindahkan assets baru
      }

      // 4. Restore Database (SQL)
      const sqlFile = path.join(tempDir, "database.sql");

      if (fs.existsSync(sqlFile)) {
        const pgEnv = { ...process.env, PGPASSWORD: process.env.P_PASSWORD };

        console.log(`[RESTORE] Executing: ${PSQL_CMD}`);

        const psql = spawn(
          PSQL_CMD,
          [
            "-h",
            process.env.P_HOST || "localhost",
            "-p",
            process.env.P_PORT || "5432",
            "-U",
            process.env.P_USER,
            "-d",
            process.env.P_DB,
            "-f",
            sqlFile,
          ],
          { env: pgEnv }
        );

        psql.on("error", (err) => {
          // Cleanup folder temp
          fs.rmSync(tempDir, { recursive: true, force: true });
          res.status(500).json({ message: `Gagal spawn psql: ${err.message}` });
        });

        psql.on("close", (code) => {
          // Cleanup folder temp (File ZIP tidak perlu dihapus karena ada di RAM)
          fs.rmSync(tempDir, { recursive: true, force: true });

          if (code === 0) {
            res.json({ message: "Restore berhasil! Silakan refresh halaman." });
          } else {
            res.status(500).json({
              message: "Gagal merestore database SQL (Exit code error).",
            });
          }
        });
      } else {
        // Cleanup jika file sql tidak ada
        fs.rmSync(tempDir, { recursive: true, force: true });
        res
          .status(400)
          .json({ message: "File database.sql tidak ditemukan dalam backup." });
      }
    } catch (error) {
      console.error(error);
      // Cleanup folder temp jika terjadi crash
      if (fs.existsSync(tempDir))
        fs.rmSync(tempDir, { recursive: true, force: true });
      res.status(500).json({ message: "Restore Failed: " + error.message });
    }
  }
);

router.get(
  "/tables",
  authorize("admin"),
  withQuery(async (req, res, pool) => {
    // Ambil semua tabel public
    const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name != 'configurations'
        AND table_name != 'provinces'
        AND table_name != 'regencies'
        AND table_name != 'districts'
        AND table_name != 'villages'
        AND table_name != 'couriers'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    `;
    const result = await pool.query(query);
    const tables = result.rows.map((row) => row.table_name);
    res.json(tables);
  })
);

router.post(
  "/reset-tables",
  authorize("admin"),
  withTransaction(async (req, res, client) => {
    const { tables } = req.body; // Array: ['users', 'products', 'orders', ...]

    if (!tables || tables.length === 0) {
      return res.status(400).json({ message: "Tidak ada tabel yang dipilih" });
    }

    // 1. Validasi nama tabel (Security)
    const validTablesRes = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    const validTableNames = validTablesRes.rows.map((r) => r.table_name);

    // Filter hanya tabel yang valid yang ada di DB
    const safeTables = tables.filter((t) => validTableNames.includes(t));

    if (safeTables.length === 0) {
      return res.status(400).json({ message: "Nama tabel tidak valid" });
    }

    // 2. Pisahkan logika untuk 'users' dan tabel lainnya
    const tablesToTruncate = safeTables.filter((t) => t !== "users");
    const shouldCleanUsers = safeTables.includes("users");

    try {
      // A. Truncate tabel lain (Cepat & Reset ID)
      if (tablesToTruncate.length > 0) {
        // Gunakan CASCADE agar data anak (child rows) ikut terhapus otomatis
        const queryTruncate = `TRUNCATE TABLE ${tablesToTruncate.join(
          ", "
        )} RESTART IDENTITY CASCADE;`;
        await client.query(queryTruncate);
      }

      // B. Delete Users (Kecuali Admin)
      if (shouldCleanUsers) {
        // Kita pakai DELETE agar bisa memfilter WHERE role != 'admin'
        // ID Admin tidak akan tereset, dan ID user baru akan melanjutkannya (misal mulai dari 500), ini normal.
        const queryDeleteUsers = "DELETE FROM users WHERE role != 'admin'";
        await client.query(queryDeleteUsers);
      }

      res.json({
        message: `Berhasil membersihkan data. ${
          shouldCleanUsers ? "User (kecuali admin) dihapus." : ""
        } ${tablesToTruncate.length} tabel lain dikosongkan.`,
      });
    } catch (error) {
      console.error("Reset Error:", error);
      // withTransaction akan otomatis rollback jika error dilempar di sini
      throw new Error("Gagal mengosongkan tabel: " + error.message);
    }
  })
);

export default router;
