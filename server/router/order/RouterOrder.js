import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { withQuery, withTransaction } from "../../utils/dbWrapper.js";
import * as msg from "../../utils/messages.js";

const router = Router();

// ============================================================================
// Get my orders
// ============================================================================
router.get(
  "/get-my-order",
  authorize("user"),
  withQuery(async (req, res, pool) => {
    const { page = 1, limit = 10, search } = req.query;
    const userId = req.user.id;

    // 1. Setup Pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    // 2. Setup Dynamic Query (Search Logic)
    let queryParams = [userId];
    let whereClauses = ["o.user_id = $1"];

    if (search) {
      queryParams.push(`%${search}%`);
      const searchIndex = queryParams.length;

      whereClauses.push(`(
        o.invoice_number ILIKE $${searchIndex} OR 
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id AND p.name ILIKE $${searchIndex}
        )
      )`);
    }

    const whereStr = `WHERE ${whereClauses.join(" AND ")}`;

    // 3. Query Utama (Updated with Address Joins)
    const dataQuery = `
      SELECT 
        o.id, 
        o.invoice_number, 
        o.status, 
        o.total_price, 
        o.created_at,
        o.shipping_courier, 
        o.shipping_service,
        o.shipping_fee,
        
        -- Info Penerima & Alamat Snapshot
        o.recipient_name,
        o.shipping_address_detail,
        o.shipping_postal_code,
        
        -- Join untuk mengambil Nama Wilayah
        prov.name as shipping_province_name,
        reg.name as shipping_regency_name,
        dist.name as shipping_district_name,
        vill.name as shipping_village_name,

        -- Menggabungkan detail items menjadi array JSON
        (
            SELECT json_agg(
                json_build_object(
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'variant', CASE 
                        WHEN pv.id IS NOT NULL THEN concat(pv.color, ' - ', pv.size)
                        ELSE null 
                    END,
                    'image', (SELECT link FROM images WHERE product_id = p.id LIMIT 1)
                )
            )
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
            WHERE oi.order_id = o.id
        ) as items
      FROM orders o
      -- Lakukan Join ke tabel wilayah berdasarkan ID yang tersimpan di snapshot order
      LEFT JOIN provinces prov ON o.shipping_province_id = prov.id
      LEFT JOIN regencies reg ON o.shipping_regency_id = reg.id
      LEFT JOIN districts dist ON o.shipping_district_id = dist.id
      LEFT JOIN villages vill ON o.shipping_village_id = vill.id
      ${whereStr}
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    // 4. Query Total Data
    const countQuery = `SELECT COUNT(*) as total FROM orders o ${whereStr}`;

    // 5. Eksekusi
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...queryParams, limitInt, offset]),
      pool.query(countQuery, queryParams),
    ]);

    const totalData = parseInt(countResult.rows[0].total);
    const totalPage = Math.ceil(totalData / limitInt);

    res.json({
      message: "Data pesanan berhasil diambil",
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

//GET Order Status
router.get(
  "/get-order-status",
  authorize("user", "admin"),
  withQuery(async (req, res, pool) => {
    const { inv } = req.query;
    const userid = req.user.id;

    const invoice_number = inv;

    if (!invoice_number) {
      return res.status(400).json({ message: "Invoice number diperlukan" });
    }

    const query = `
      SELECT 
        o.id, 
        o.invoice_number, 
        o.status, 
        o.total_price, 
        o.created_at,
        o.shipping_courier,
        o.shipping_service,
        o.shipping_fee,
        
        -- SUBQUERY: Ambil detail produk sebagai JSON Array
        (
            SELECT json_agg(
                json_build_object(
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'variant_name', CASE 
                        WHEN pv.id IS NOT NULL THEN concat(pv.color, ' ', pv.size)
                        ELSE null 
                    END,
                    'image_url', (SELECT link FROM images WHERE product_id = p.id LIMIT 1)
                )
            )
            FROM order_items oi
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
            WHERE oi.order_id = o.id
        ) as items

      FROM orders o 
      WHERE o.invoice_number = $1 AND o.user_id = $2
    `;

    const result = await pool.query(query, [invoice_number, userid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    res.status(200).json(result.rows[0]);
  })
);

// GET courier
router.get(
  "/get-couriers",
  authorize("user", "admin"),
  withQuery(async (req, res, pool) => {
    const data = await pool.query(
      `SELECT * from couriers WHERE isactive = true ORDER BY courier ASC`
    );

    res.status(200).json(data.rows);
  })
);

// GET Shipping Cost
router.get(
  "/get-shipping-cost",
  authorize("user"),
  withQuery(async (req, res, pool) => {
    try {
      // 1. Ambil API Key dan Origin ID dari database
      const configQuery = `
        SELECT key, value 
        FROM configurations 
        WHERE key IN ('shipping_api', 'shipping_origin')
      `;
      const configResult = await pool.query(configQuery);
      const configMap = configResult.rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      const apiKey = configMap["shipping_api"];
      const originId = configMap["shipping_origin"];

      if (!apiKey || !originId) {
        return res.status(500).json({
          message: "Konfigurasi API RajaOngkir belum lengkap.",
        });
      }

      // 2. Ambil parameter dari query URL
      // destination di sini adalah string (nama desa/kecamatan)
      const { courier, destination, weight } = req.query;

      if (!destination || !courier || !weight) {
        return res.status(400).json({
          message:
            "Mohon lengkapi courier, destination (nama lokasi), dan weight.",
        });
      }

      // Header untuk request ke API Komerce
      const requestHeaders = {
        accept: "application/json",
        key: apiKey,
      };

      // -----------------------------------------------------------
      // LANGKAH 3: Cari ID Destinasi berdasarkan nama (Search)
      // -----------------------------------------------------------
      const searchLocation = encodeURIComponent(destination.toLowerCase());

      // Kita limit 1 saja agar mendapatkan hasil paling relevan di urutan pertama
      const searchUrl = `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${searchLocation}&limit=1`;

      const searchResponse = await fetch(searchUrl, {
        method: "GET",
        headers: requestHeaders,
      });

      const searchResult = await searchResponse.json();

      // Validasi response search
      if (
        !searchResult.data ||
        !Array.isArray(searchResult.data) ||
        searchResult.data.length === 0
      ) {
        return res.status(404).json({
          message: `Lokasi '${destination}' tidak ditemukan. Coba gunakan nama kecamatan yang lebih spesifik.`,
        });
      }

      // Ambil ID dari data pertama (index 0) sesuai sample response
      const destinationData = searchResult.data[0];
      const destinationId = destinationData.id;

      // -----------------------------------------------------------
      // LANGKAH 4: Hitung Ongkir menggunakan ID yang ditemukan
      // -----------------------------------------------------------
      const shippingParams = new URLSearchParams();
      shippingParams.append("courier", courier);
      shippingParams.append("origin", originId);
      shippingParams.append("destination", destinationId); // ID hasil pencarian
      shippingParams.append("weight", weight);

      const costOptions = {
        method: "POST",
        headers: {
          ...requestHeaders,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: shippingParams.toString(),
      };

      const costResponse = await fetch(
        "https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost",
        costOptions
      );

      const costResult = await costResponse.json();

      if (costResult.meta && costResult.meta.code !== 200) {
        return res.status(400).json({
          message: costResult.meta.message || "Gagal menghitung ongkos kirim.",
        });
      }

      // -----------------------------------------------------------
      // LANGKAH 5: Response ke Frontend
      // -----------------------------------------------------------
      // Mengembalikan data ongkir + info lokasi yang didapat agar user tahu lokasi mana yang terdeteksi
      res.status(200).json({
        costs: costResult.data,
        location_details: {
          id: destinationData.id,
          label: destinationData.label,
          district: destinationData.district_name,
          city: destinationData.city_name,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  })
);

// Create order & Get midtrans TOKEN
router.post(
  "/create-order",
  authorize("user"),
  withTransaction(async (req, res, pool) => {
    // 1. Ambil Konfigurasi Midtrans dari Database
    const configQuery = `
        SELECT key, value 
        FROM configurations 
        WHERE key 
        IN ('midtrans_server_key', 'midtrans_base_url', 'domain')
      `;
    const configResult = await pool.query(configQuery);
    const configMap = configResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const serverKey = configMap["midtrans_server_key"];
    const midtransBaseUrl = configMap["midtrans_base_url"];
    const domain = configMap["domain"];

    if (!serverKey || !midtransBaseUrl) {
      throw new Error("Konfigurasi Midtrans server belum lengkap di database.");
    }

    // 2. Ambil Data dari Frontend
    const {
      items, // Array: [{product_id, product_variant_id, quantity}, ...]
      shipping_fee,
      courier,
      shipping_service, // e.g. "REG"
      address, // Object alamat lengkap
    } = req.body;

    const userId = req.user.id;

    if (!items || items.length === 0 || !address) {
      return res
        .status(400)
        .json({ message: "Data pesanan atau alamat tidak lengkap." });
    }

    // 3. Verifikasi Harga & Stok (Anti-Tamper Logic) [cite: 7]
    let verifiedTotalItemPrice = 0;
    const verifiedItems = [];

    for (const item of items) {
      const productQuery = `
        SELECT 
          p.id as p_id, p.name, p.price, p.weight, p.stock as p_stock,
          pv.id as pv_id, pv.name as pv_name, pv.price_adjustment, pv.stock as pv_stock
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.id = $1
        WHERE p.id = $2
      `;

      const productRes = await pool.query(productQuery, [
        item.product_variant_id || null, // $1
        item.product_id, // $2
      ]);

      if (productRes.rows.length === 0) {
        throw new Error(`Produk ID ${item.product_id} tidak ditemukan.`);
      }

      const productData = productRes.rows[0];

      // Cek Stok
      const currentStock = productData.pv_id
        ? productData.pv_stock
        : productData.p_stock;
      if (currentStock < item.quantity) {
        throw new Error(
          `Stok untuk produk ${productData.name} tidak mencukupi.`
        );
      }

      // Hitung Harga Asli
      let finalPrice = Number(productData.price);
      if (productData.pv_id) {
        finalPrice += Number(productData.price_adjustment);
      }

      verifiedTotalItemPrice += finalPrice * item.quantity;

      verifiedItems.push({
        ...item,
        name:
          productData.name +
          (productData.pv_name ? ` - ${productData.pv_name}` : ""),
        price: finalPrice,
      });
    }

    // Hitung Grand Total
    const fixShippingFee = Number(shipping_fee) || 0;
    const grandTotal = verifiedTotalItemPrice + fixShippingFee;

    // 4. Generate Invoice Number [cite: 5]
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${userId}-${randomStr}`;

    // 5. Simpan Transaksi ke Database (Status: PENDING) [cite: 13, 14, 15]

    // 5a. Insert Orders Table
    const insertOrderQuery = `
      INSERT INTO orders (
        user_id, invoice_number, status, total_price, 
        recipient_name, shipping_address_detail, 
        shipping_village_id, shipping_district_id, shipping_regency_id, shipping_province_id, shipping_postal_code,
        shipping_courier, shipping_service, shipping_fee, created_at
      ) VALUES (
        $1, $2, 'pending', $3,
        $4, $5, 
        $6, $7, $8, $9, $10,
        $11, $12, $13, NOW()
      ) RETURNING id
    `;

    const orderValues = [
      userId,
      invoiceNumber,
      grandTotal,
      address.recipient_name,
      address.detail,
      address.village_id,
      address.district_id,
      address.regency_id,
      address.province_id,
      address.postal_code,
      courier,
      shipping_service,
      fixShippingFee,
    ];

    const orderResult = await pool.query(insertOrderQuery, orderValues);
    const newOrderId = orderResult.rows[0].id;

    // 5b. Insert Order Items
    for (const vItem of verifiedItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newOrderId,
          vItem.product_id,
          vItem.product_variant_id || null,
          vItem.quantity,
          vItem.price,
        ]
      );
    }

    // 6. Request ke Midtrans Snap [cite: 9, 12]
    const midtransItems = verifiedItems.map((item) => ({
      id: item.product_variant_id
        ? `VAR-${item.product_variant_id}`
        : `PROD-${item.product_id}`,
      price: item.price,
      quantity: item.quantity,
      name: item.name.substring(0, 50),
    }));

    if (fixShippingFee > 0) {
      midtransItems.push({
        id: "SHIP-FEE",
        price: fixShippingFee,
        quantity: 1,
        name: `Ongkir (${courier.toUpperCase()} - ${shipping_service})`,
      });
    }

    const parameter = {
      transaction_details: {
        order_id: invoiceNumber,
        gross_amount: grandTotal,
      },
      item_details: midtransItems,
      customer_details: {
        first_name: address.recipient_name.substring(0, 20),
        email: req.user.email,
        phone: address.phone,
        billing_address: {
          first_name: address.recipient_name,
          phone: address.phone,
          address: address.detail,
          city: address.district_name,
          postal_code: address.postal_code,
          country_code: "IDN",
        },
        shipping_address: {
          first_name: address.recipient_name,
          phone: address.phone,
          address: address.detail,
          city: address.district_name,
          postal_code: address.postal_code,
          country_code: "IDN",
        },
      },
      callbacks: {
        finish: `${domain}/order/status/${invoiceNumber}`,
        pending: `${domain}/order/status/${invoiceNumber}`,
      },
    };

    const authString = Buffer.from(serverKey + ":").toString("base64");
    const snapResponse = await fetch(
      `${midtransBaseUrl}/snap/v1/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(parameter),
      }
    );

    const snapData = await snapResponse.json();

    if (!snapResponse.ok) {
      throw new Error(
        snapData.error_messages
          ? snapData.error_messages.join(", ")
          : "Gagal menghubungi Midtrans"
      );
    }

    // ================================================================
    // 7. (BARU) Hapus Item dari Cart (Database Carts)
    // ================================================================
    // Kita loop item yang dibeli, lalu hapus dari tabel carts milik user.
    // Menggunakan "IS NOT DISTINCT FROM" agar bisa handle variant_id NULL.

    const deleteCartQuery = `
        DELETE FROM carts 
        WHERE user_id = $1 
        AND product_id = $2 
        AND product_variant_id IS NOT DISTINCT FROM $3
    `;

    for (const item of items) {
      await pool.query(deleteCartQuery, [
        userId,
        item.product_id,
        item.product_variant_id || null,
      ]);
    }

    // 8. Return ke Frontend [cite: 16]
    res.status(200).json({
      message: "Order berhasil dibuat",
      token: snapData.token,
      redirect_url: snapData.redirect_url,
      order_id: newOrderId,
      invoice_number: invoiceNumber,
      total_price: grandTotal,
    });
  })
);

// Update order after payment
router.post(
  "/update-order-status",
  authorize("user"),
  withTransaction(async (req, res, pool) => {
    const { inv, status, method } = req.body;
    const userId = req.user.id;

    if (!inv || !status || !method) {
      return res.status(400).json({ message: "Invoice dan Status diperlukan" });
    }

    const query = `
      UPDATE orders 
      SET status = $1, method = $2, updated_at = NOW()
      WHERE invoice_number = $3 AND user_id = $4
      RETURNING id, invoice_number, status
    `;

    const result = await pool.query(query, [status, method, inv, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    res.status(200).json({ message: msg.updated });
  })
);

export default router;
