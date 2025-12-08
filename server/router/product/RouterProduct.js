import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withTransaction, withQuery } from "../../utils/dbWrapper.js";
import * as msg from "../../utils/messages.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { compressImage } from "./../../utils/comporessImage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gunakan Memory Storage agar bisa di-compress sebelum save
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper untuk sanitasi nama folder
const sanitizeName = (name) => {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

const router = Router();

// ============================================================================
// 1. GET PRODUCTS (READ ALL - Pagination & Infinite Scroll)
// ============================================================================
router.get(
  "/get-products",
  withQuery(async (req, res, pool) => {
    const { page = 1, limit = 20, search, categoryId } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    let queryParams = [];
    let whereClauses = [];
    let paramCounter = 1;

    // Filter Pencarian
    if (search) {
      whereClauses.push(`p.name ILIKE $${paramCounter}`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    // Filter Kategori
    if (categoryId) {
      whereClauses.push(`p.category_id = $${paramCounter}`);
      queryParams.push(categoryId);
      paramCounter++;
    }

    const whereStr =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // PERBAIKAN: Ubah 'createdat' menjadi 'created_at' sesuai tabel baru
    // Query mengambil produk + gambar thumbnail
    const dataQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT link FROM images WHERE product_id = p.id LIMIT 1) as image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereStr}
      ORDER BY p.created_at DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      ${whereStr}
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...queryParams, limitInt, offset]),
      pool.query(countQuery, queryParams),
    ]);

    const totalData = parseInt(countResult.rows[0].total);
    const totalPage = Math.ceil(totalData / limitInt);

    res.json({
      message: "Data fetched",
      data: dataResult.rows,
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalData,
        totalPage,
        hasNext: pageInt < totalPage,
      },
    });
  })
);

// ============================================================================
// 2. GET PRODUCT BY ID (READ SINGLE + VARIANTS)
// ============================================================================
router.get(
  "/get-product",
  withQuery(async (req, res, pool) => {
    const { id } = req.query;

    if (!id) return res.status(400).json({ message: "ID is required" });

    // 1. Ambil Data Produk Utama
    const productResult = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: msg.notFound });
    }

    // 2. Ambil Images
    const imagesResult = await pool.query(
      `SELECT id, link FROM images WHERE product_id = $1`,
      [id]
    );

    // 3. TAMBAHAN: Ambil Variants (Size/Color) karena tabel baru mendukung varian
    const variantsResult = await pool.query(
      `SELECT id, name, color, size, stock, price_adjustment 
         FROM product_variants WHERE product_id = $1 ORDER BY id ASC`,
      [id]
    );

    // 4. Ambil Reviews
    const reviewsResult = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, u.avatar
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const product = productResult.rows[0];
    product.images = imagesResult.rows;
    product.variants = variantsResult.rows; // Attach variants ke response
    product.reviews = reviewsResult.rows;

    res.json(product);
  })
);

// ============================================================================
// 3. SAVE PRODUCT (CREATE & UPDATE)
// ============================================================================
router.post(
  "/save-product",
  authorize("admin"),
  upload.array("images"),
  withTransaction(async (req, res, client) => {
    const {
      id,
      category_id,
      name,
      description,
      price,
      capital,
      stock,
      weight,
    } = req.body;

    // Validasi dasar
    if (!name || !price || !capital) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const profit = parseFloat(price) - parseFloat(capital);
    let productId = id;

    // 1. DATABASE OPERATION (Insert / Update Product)
    if (productId) {
      // --- UPDATE ---
      const check = await client.query(
        "SELECT id FROM products WHERE id = $1",
        [productId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ message: msg.notFound });
      }

      await client.query(
        `UPDATE products SET 
          category_id = $1, name = $2, description = $3, 
          price = $4, capital = $5, profit = $6, 
          stock = $7, weight = $8
         WHERE id = $9`,
        [
          category_id,
          name,
          description,
          price,
          capital,
          profit,
          stock,
          weight,
          productId,
        ]
      );
    } else {
      // --- CREATE ---
      const insertResult = await client.query(
        `INSERT INTO products 
          (category_id, name, description, price, capital, profit, stock, weight) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`,
        [category_id, name, description, price, capital, profit, stock, weight]
      );
      productId = insertResult.rows[0].id;
    }

    // 2. IMAGE HANDLING (Compress & Save)
    if (req.files && req.files.length > 0) {
      // ============================================================
      // LOGIKA TAMBAHAN: HAPUS GAMBAR LAMA JIKA UPDATE & ADA GAMBAR BARU
      // ============================================================
      if (id) {
        // Jika ini adalah update (karena 'id' dikirim dari body)
        // A. Ambil path gambar lama dari DB
        const oldImages = await client.query(
          "SELECT link FROM images WHERE product_id = $1",
          [productId]
        );

        // B. Hapus File Fisik
        for (const img of oldImages.rows) {
          // Construct absolute path.
          // Link di DB: /assets/folder/file.jpeg
          // Lokasi Fisik: [Root]/server/assets/folder/file.jpeg
          const oldFilePath = path.join(process.cwd(), "server", img.link);

          try {
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (err) {
            console.error(`Gagal menghapus file lama: ${oldFilePath}`, err);
            // Lanjut saja meski gagal hapus file, agar transaksi DB tidak batal
          }
        }

        // C. Hapus Record di Database
        await client.query("DELETE FROM images WHERE product_id = $1", [
          productId,
        ]);
      }
      // ============================================================

      // Tentukan path folder: ./server/assets/"nama produk"/
      // Gunakan sanitizeName agar nama folder aman
      const folderName = sanitizeName(name);
      const targetDir = path.join(process.cwd(), "server/assets", folderName);

      // Buat direktori jika belum ada
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const file of req.files) {
        const uniqueSuffix = uuidv4();
        // Nama file: image_uuid.jpeg
        const filename = `img_${uniqueSuffix}.jpeg`;
        const outputPath = path.join(targetDir, filename);

        // Simpan URL relatif untuk database
        const dbLink = `/assets/${folderName}/${filename}`;

        // Kompres dan simpan file fisik
        await compressImage(file.buffer, outputPath);

        // Masukkan record ke tabel images
        await client.query(
          "INSERT INTO images (product_id, link) VALUES ($1, $2)",
          [productId, dbLink]
        );
      }
    }

    const message = id ? msg.updated : msg.created;
    return res.status(id ? 200 : 201).json({ message, id: productId });
  })
);

// ============================================================================
// 4. DELETE PRODUCT
// ============================================================================
router.delete(
  "/delete-product",
  authorize("admin"),
  withTransaction(async (req, res, client) => {
    const { id } = req.query;

    if (!id) return res.status(400).json({ message: "ID is required" });

    // 1. Ambil nama produk untuk mengetahui nama folder sebelum dihapus
    const check = await client.query(
      "SELECT name FROM products WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: msg.notFound });
    }

    const productName = check.rows[0].name;

    // 2. Hapus Data di Database (Cascade akan menghapus images, variants, dll)
    await client.query("DELETE FROM products WHERE id = $1", [id]);

    // 3. Hapus Folder Fisik
    const folderName = sanitizeName(productName);
    const targetDir = path.join(process.cwd(), "server/assets", folderName);

    // Cek apakah folder ada, lalu hapus recursive
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    res.json({ message: msg.removed });
  })
);

export default router;
