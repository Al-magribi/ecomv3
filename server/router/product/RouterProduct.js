import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withTransaction, withQuery } from "../../utils/dbWrapper.js";
import * as msg from "../../utils/messages.js";

const router = Router();

// ============================================================================
// 1. GET PRODUCTS (READ ALL - Pagination & Infinite Scroll)
// ============================================================================
router.get(
  "/get-products",
  withQuery(async (req, res, pool) => {
    const { page = 1, limit = 12, search, categoryId } = req.query;

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

    // Validasi
    if (!name || !price || !capital) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const profit = parseFloat(price) - parseFloat(capital);

    if (id) {
      // --- UPDATE ---
      const check = await client.query(
        "SELECT id FROM products WHERE id = $1",
        [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ message: msg.notFound });
      }

      await client.query(
        `UPDATE products SET 
          category_id = $1, name = $2, description = $3, 
          price = $4, capital = $5, profit = $6, 
          stock = $7, weight = $8
          -- rating dan sold_count tidak diupdate manual di sini (via trigger/transaksi lain)
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
          id,
        ]
      );

      return res.json({ message: msg.updated });
    } else {
      // --- CREATE ---
      // Kolom created_at sudah otomatis (DEFAULT NOW())
      // Kolom sold_count dan rating otomatis 0
      const insertResult = await client.query(
        `INSERT INTO products 
          (category_id, name, description, price, capital, profit, stock, weight) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`,
        [category_id, name, description, price, capital, profit, stock, weight]
      );

      const newId = insertResult.rows[0].id;
      return res.status(201).json({ message: msg.created, id: newId });
    }
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

    const check = await client.query("SELECT id FROM products WHERE id = $1", [
      id,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: msg.notFound });
    }

    // ON DELETE CASCADE di database akan otomatis menghapus:
    // - images
    // - reviews
    // - product_variants
    await client.query("DELETE FROM products WHERE id = $1", [id]);

    res.json({ message: msg.removed });
  })
);

export default router;
