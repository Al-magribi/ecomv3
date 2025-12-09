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

router.get(
  "/sales-report",
  authorize("admin"),
  withQuery(async (req, res, pool) => {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const start = startDate || new Date(new Date().setDate(1)).toISOString();
    const end = endDate || new Date().toISOString();

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    // 1. QUERY DATA DETIL
    // Menampilkan Order + JSON Array Item dengan perhitungan profit per produk
    const dataQuery = `
      SELECT 
        o.id, 
        o.invoice_number, 
        o.created_at, 
        o.total_price as grand_total, -- Total bayar user (termasuk ongkir)
        o.shipping_fee,
        o.recipient_name,
        u.name as user_account_name,
        
        -- Hitung Total Modal (HPP) untuk Order ini
        (
            SELECT COALESCE(SUM(p.capital * oi.quantity), 0)
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
        ) as total_capital,

        -- DETAIL ITEM (JSON)
        (
            SELECT json_agg(
                json_build_object(
                    'product_name', p.name,
                    'variant', CASE 
                        WHEN pv.id IS NOT NULL THEN concat(pv.color, ' - ', pv.size)
                        ELSE '-' 
                    END,
                    'quantity', oi.quantity,
                    'price_sale_unit', oi.price,        -- Harga Jual Satuan (saat transaksi)
                    'capital_unit', p.capital,          -- Modal Satuan
                    'gross_total', (oi.price * oi.quantity), -- Total Kotor (Omzet Item)
                    'net_profit', ((oi.price - p.capital) * oi.quantity) -- Keuntungan Bersih Item
                )
            )
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
            WHERE oi.order_id = o.id
        ) as items_detail

      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status = 'completed'
      AND o.created_at::date >= $1::date 
      AND o.created_at::date <= $2::date
      ORDER BY o.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    // 2. QUERY SUMMARY (Total Keseluruhan untuk Kartu Atas)
    // Menghitung Total Transaksi, Total Omzet, dan Total Profit Bersih
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as total_transactions,
        
        -- Total Revenue (Omzet kotor dari total_price orders)
        COALESCE(SUM(o.total_price), 0) as total_revenue,

        -- Total Net Profit (Harga Jual Item - Modal Item)
        -- Kita hitung dari order_items agar akurat per produk
        COALESCE(SUM(
          (oi.price - p.capital) * oi.quantity
        ), 0) as total_net_profit

      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'completed'
      AND o.created_at::date >= $1::date 
      AND o.created_at::date <= $2::date
    `;

    const [dataRes, summaryRes] = await Promise.all([
      pool.query(dataQuery, [start, end, limitInt, offset]),
      pool.query(summaryQuery, [start, end]),
    ]);

    const summary = summaryRes.rows[0];
    const totalData = parseInt(summary.total_transactions);
    const totalPage = Math.ceil(totalData / limitInt);

    res.json({
      data: dataRes.rows.map((row) => ({
        ...row,
        // Hitung profit order di level JS atau SQL (di atas sudah SQL, tapi kita rapikan)
        // Profit Order = (Grand Total - Ongkir) - Total Modal
        // Note: Logic di bawah adalah estimasi bersih.
        total_net_profit_order:
          parseFloat(row.grand_total) -
          parseFloat(row.shipping_fee) -
          parseFloat(row.total_capital),
      })),
      summary: {
        total_transactions: parseInt(summary.total_transactions),
        total_revenue: parseFloat(summary.total_revenue),
        total_net_profit: parseFloat(summary.total_net_profit),
      },
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

router.get(
  "/users-report",
  authorize("admin"),
  withQuery(async (req, res, pool) => {
    const { page = 1, limit = 10, search } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    let queryParams = [];
    // Filter default: Bukan admin
    let whereClauses = ["u.role != 'admin'"];

    // Search Logic (Cari di Users atau Alamat)
    if (search) {
      queryParams.push(`%${search}%`);
      const i = queryParams.length;
      whereClauses.push(`(
        u.name ILIKE $${i} OR 
        u.email ILIKE $${i} OR
        addr.recipient_name ILIKE $${i}
      )`);
    }

    const whereStr = `WHERE ${whereClauses.join(" AND ")}`;

    // Update Query: Join ke Address dan Wilayah
    const dataQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.is_active, 
        u.created_at,
        
        -- Info Alamat Utama (Primary)
        addr.detail as address_detail,
        addr.postal_code,
        prov.name as province_name,
        reg.name as regency_name,
        dist.name as district_name,
        vill.name as village_name

      FROM users u
      -- Ambil hanya alamat utama (is_primary = true)
      LEFT JOIN addresses addr ON u.id = addr.user_id AND addr.is_primary = true
      LEFT JOIN provinces prov ON addr.province_id = prov.id
      LEFT JOIN regencies reg ON addr.regency_id = reg.id
      LEFT JOIN districts dist ON addr.district_id = dist.id
      LEFT JOIN villages vill ON addr.village_id = vill.id
      
      ${whereStr}
      ORDER BY u.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM users u LEFT JOIN addresses addr ON u.id = addr.user_id AND addr.is_primary = true ${whereStr}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...queryParams, limitInt, offset]),
      pool.query(countQuery, queryParams),
    ]);

    const totalData = parseInt(countResult.rows[0].total);
    const totalPage = Math.ceil(totalData / limitInt);

    res.json({
      message: "Data user berhasil diambil",
      data: dataResult.rows,
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalData,
        totalPage,
        hasNext: pageInt < totalPage,
        hasPrev: pageInt > 1,
      },
    });
  })
);

export default router;
