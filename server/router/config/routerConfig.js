import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";
import multer from "multer";
import path from "path";
import fs from "fs";
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
        const key = file.fieldname; // fieldname harus sesuai dengan 'key' di DB (misal: store_logo)

        // 1. Validasi: Pastikan key ini memang bertipe 'image' di database
        const check = await client.query(
          "SELECT id FROM configurations WHERE key = $1 AND type = 'image'",
          [key]
        );

        if (check.rows.length > 0) {
          // 2. Proses Simpan File
          const ext = path.extname(file.originalname).toLowerCase();
          const filename = `${key}_${Date.now()}${ext}`; // Timestamp agar cache refresh
          const outputPath = path.join(targetDir, filename);
          const dbLink = `/assets/shop/${filename}`;

          // Kompres jika gambar, simpan biasa jika ico/svg
          if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
            await compressImage(file.buffer, outputPath);
          } else {
            fs.writeFileSync(outputPath, file.buffer);
          }

          // 3. Update Database Path
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

export default router;
