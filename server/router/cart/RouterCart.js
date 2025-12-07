import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";
import * as msg from "../../utils/messages.js";

const router = Router();

// ==========================================
// 1. GET CART (Mendapatkan Keranjang User)
// ==========================================
router.get(
  "/get-my-cart",
  authorize("user"), // Memastikan user login
  withQuery(async (req, res, pool) => {
    const userId = req.user.id;

    // Query Complex: Join Cart -> Product -> Variant -> Image
    // Menggunakan COALESCE untuk menangani jika varian kosong
    const query = `
      SELECT 
        c.id as cart_id,
        c.product_id,
        c.product_variant_id,
        c.quantity,
        p.name as product_name,
        p.weight,
        p.stock as product_stock,
        COALESCE(pv.name, '') as variant_name,
        COALESCE(pv.stock, p.stock) as available_stock,
        
        -- Hitung Harga: Harga Produk + Adjustment Varian (jika ada)
        (p.price + COALESCE(pv.price_adjustment, 0)) as final_price,
        
        -- Ambil 1 Gambar saja (Subquery)
        (SELECT link FROM images WHERE product_id = p.id LIMIT 1) as image_url
        
      FROM carts c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants pv ON c.product_variant_id = pv.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json(result.rows);
  })
);

// ==========================================
// 2. ADD TO CART (Tambah / Update Qty)
// ==========================================
router.post(
  "/add-to-cart",
  authorize("user"),
  withTransaction(async (req, res, client) => {
    const userId = req.user.id;
    const { product_id, product_variant_id, quantity } = req.body;
    const qtyToAdd = parseInt(quantity) || 1;

    // Gunakan ON CONFLICT untuk Upsert (Insert jika baru, Update jika sudah ada)
    // Constraint unique ada di table carts: (user_id, product_id, product_variant_id)
    const query = `
      INSERT INTO carts (user_id, product_id, product_variant_id, quantity)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, product_id, product_variant_id) 
      DO UPDATE SET 
        quantity = carts.quantity + EXCLUDED.quantity,
        created_at = NOW()
      RETURNING *
    `;

    await client.query(query, [
      userId,
      product_id,
      product_variant_id || null, // Handle null jika tidak ada varian
      qtyToAdd,
    ]);

    res.status(201).json({ message: msg.created });
  })
);

// ==========================================
// 3. UPDATE QUANTITY (Ubah Jumlah)
// ==========================================
router.put(
  "/update-qty",
  authorize("user"),
  withTransaction(async (req, res, client) => {
    const userId = req.user.id;
    const { cart_id, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Jumlah minimal 1" });
    }

    // Update quantity berdasarkan cart_id dan user_id (security check)
    const result = await client.query(
      `UPDATE carts SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING id`,
      [quantity, cart_id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: msg.notFound });
    }

    res.json({ message: msg.updated });
  })
);

// ==========================================
// 4. DELETE ITEM (Hapus dari Keranjang)
// ==========================================
router.delete(
  "/delete-item/:id",
  authorize("user"),
  withTransaction(async (req, res, client) => {
    const userId = req.user.id;
    const cartId = req.params.id;

    const result = await client.query(
      `DELETE FROM carts WHERE id = $1 AND user_id = $2`,
      [cartId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: msg.notFound });
    }

    res.json({ message: msg.removed });
  })
);

export default router;
