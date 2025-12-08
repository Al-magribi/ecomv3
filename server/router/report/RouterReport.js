import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withTransaction, withQuery } from "../../utils/dbWrapper.js";

const router = Router();

router.get(
  "/summary",
  authorize("admin"),
  withQuery(async (req, res, pool) => {
    // 1. Hitung Total Revenue (Hanya yang statusnya completed atau processing agar valid)
    const revenueQuery = `
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM orders 
      WHERE status IN ('completed', 'processing')
    `;

    // 2. Hitung Total Order (Semua status)
    const ordersCountQuery = `SELECT COUNT(*) as total FROM orders`;

    // 3. Hitung Total Produk
    const productsCountQuery = `SELECT COUNT(*) as total FROM products`;

    // 4. Hitung Total User (Role User saja)
    const usersCountQuery = `SELECT COUNT(*) as total FROM users WHERE role = 'user'`;

    // 5. Ambil 5 Transaksi Terakhir
    const recentOrdersQuery = `
      SELECT o.id, o.invoice_number, u.name as user_name, o.total_price, o.status, o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `;

    // Jalankan query secara paralel (Promise.all) agar performa lebih cepat
    const [revenueRes, ordersRes, productsRes, usersRes, recentRes] =
      await Promise.all([
        pool.query(revenueQuery),
        pool.query(ordersCountQuery),
        pool.query(productsCountQuery),
        pool.query(usersCountQuery),
        pool.query(recentOrdersQuery),
      ]);

    res.json({
      revenue: parseFloat(revenueRes.rows[0].total),
      total_orders: parseInt(ordersRes.rows[0].total),
      total_products: parseInt(productsRes.rows[0].total),
      total_users: parseInt(usersRes.rows[0].total),
      recent_orders: recentRes.rows,
    });
  })
);

export default router;
