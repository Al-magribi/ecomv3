import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";
import * as msg from "../../utils/messages.js";

const router = Router();

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

router.post(
  "/save-review",
  authorize("user"),
  withTransaction(async (req, res, client) => {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id;

    // 1. Validasi Input Sederhana
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating harus antara 1 sampai 5" });
    }

    // 2. Cek Validasi Pembelian
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

    // 3. Manual UPSERT (Cek -> Insert/Update)
    // Cek apakah user ini sudah pernah review produk ini sebelumnya
    const existingReview = await client.query(
      `SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2`,
      [user_id, product_id]
    );

    let resultReview;

    if (existingReview.rowCount > 0) {
      // A. Jika sudah ada: UPDATE
      const updateQuery = `
        UPDATE reviews 
        SET rating = $3, comment = $4, created_at = NOW()
        WHERE user_id = $1 AND product_id = $2
        RETURNING id, rating, comment, created_at
      `;
      const updateRes = await client.query(updateQuery, [
        user_id,
        product_id,
        rating,
        comment,
      ]);
      resultReview = updateRes.rows[0];
    } else {
      // B. Jika belum ada: INSERT
      const insertQuery = `
        INSERT INTO reviews (user_id, product_id, rating, comment, created_at) 
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, rating, comment, created_at
      `;
      const insertRes = await client.query(insertQuery, [
        user_id,
        product_id,
        rating,
        comment,
      ]);
      resultReview = insertRes.rows[0];
    }

    res.status(200).json({
      status: "success",
      message: "Ulasan berhasil disimpan",
      data: resultReview,
    });
  })
);

export default router;
