import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import * as msg from "../../utils/messages.js";
import { withTransaction, withQuery } from "../../utils/dbWrapper.js";

const router = Router();

// ============================================================================
// 1. GET CATEGORIES
// ============================================================================
router.get(
  "/get-categories",
  withQuery(async (req, res, pool) => {
    const { page, limit, search } = req.query;

    // Jika tidak ada page/limit, ambil semua (untuk dropdown select)
    if (!page && !limit) {
      const data = await pool.query(
        "SELECT * FROM categories ORDER BY name ASC"
      );
      return res.json(data.rows);
    }

    // Logic Pagination
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM categories WHERE name ILIKE $1`;
    let countQuery = `SELECT count(*) AS total FROM categories WHERE name ILIKE $1`;
    let queryParams = [`%${search || ""}%`]; // Handle search undefined

    query += ` ORDER BY name ASC LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;

    // Tambahkan limit & offset ke params
    const executeParams = [...queryParams, limit, offset];

    const data = await pool.query(query, executeParams);

    // PERBAIKAN: Menggunakan 'pool', bukan 'client'
    const countData = await pool.query(
      countQuery,
      queryParams // Gunakan params asli untuk count (tanpa limit/offset)
    );

    const totalCategories = parseInt(countData.rows[0].total);
    const totalPages = Math.ceil(totalCategories / limit);
    const categories = data.rows;

    res.status(200).json({ categories, totalPages, totalCategories });
  })
);

// ============================================================================
// 2. SAVE CATEGORY
// ============================================================================
router.post(
  "/save-category",
  authorize("admin"),
  withTransaction(async (req, res, client) => {
    const { id, name } = req.body;

    if (!name) return res.status(400).json({ message: "Data tidak lengkap" });

    if (id) {
      const check = await client.query(
        "SELECT id FROM categories WHERE id = $1",
        [id]
      );
      if (check.rows.length === 0)
        return res.status(404).json({ message: msg.notFound });

      await client.query("UPDATE categories SET name = $1 WHERE id = $2", [
        name,
        id,
      ]);
      return res.json({ message: msg.updated });
    } else {
      await client.query(
        "INSERT INTO categories (name) VALUES ($1) RETURNING id",
        [name]
      );

      return res.status(201).json({ message: msg.created });
    }
  })
);

// ============================================================================
// 3. DELETE CATEGORY
// ============================================================================
router.delete(
  "/delete-category",
  authorize("admin"),
  withTransaction(async (req, res, client) => {
    const { id } = req.query;

    if (!id) return res.status(400).json({ message: "ID is required" });

    const check = await client.query(
      "SELECT id FROM categories WHERE id = $1",
      [id]
    );

    if (check.rows.length === 0)
      return res.status(404).json({ message: msg.notFound });

    await client.query("DELETE FROM categories WHERE id = $1", [id]);

    res.json({ message: msg.removed });
  })
);

export default router;
