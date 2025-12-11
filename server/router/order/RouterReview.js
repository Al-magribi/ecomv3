import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";
import * as msg from "../../utils/messages.js";

const router = Router();

router.post(
  "/save-review",
  authorize("user"),
  withTransaction(async (req, res, client) => {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id;

    // Validasi Input Sederhana
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating harus antara 1 sampai 5" });
    }

    // A. Cek Validasi Pembelian
    // User harus sudah membeli (status 'completed') produk tersebut sebelum review
    const checkPurchase = await client.query(
      `SELECT o.id 
     FROM orders o 
     JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = $1 
       AND oi.product_id = $2 
       AND o.status = 'completed'
     LIMIT 1`,
      [user_id, product_id]
    );

    if (checkPurchase.rowCount === 0) {
      return res.status(403).json({
        message:
          "Anda harus menyelesaikan pembelian produk ini sebelum memberikan ulasan.",
      });
    }

    // B. Simpan Review
    // Note: Trigger 'update_product_rating' di SQL Anda akan otomatis jalan setelah ini
    const insertReview = await client.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, rating, comment, created_at`,
      [user_id, product_id, rating, comment]
    );

    res.status(201).json({
      status: "success",
      message: "Review berhasil ditambahkan",
      data: insertReview.rows[0],
    });
  })
);

router.post(
  "/:reviewId/reply",
  authorize("admin"),
  withTransaction(async (req, res, client) => {
    // Cek Role Admin (Asumsi req.user di set oleh middleware authorize)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak. Hanya Admin." });
    }

    const { reviewId } = req.params;
    const { reply } = req.body;

    const result = await client.query(
      `UPDATE reviews 
     SET reply = $1, reply_at = NOW() 
     WHERE id = $2 
     RETURNING id, reply, reply_at`,
      [reply, reviewId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Review tidak ditemukan" });
    }

    res.json({
      status: "success",
      message: "Balasan berhasil dikirim",
      data: result.rows[0],
    });
  })
);

export default router;
