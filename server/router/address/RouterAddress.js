import { Router } from "express";
import { authorize } from "../../middleware/authorize.js"; // Sesuaikan path middleware
import { withTransaction, withQuery } from "../../utils/dbWrapper.js"; // Sesuaikan path wrapper
import * as msg from "../../utils/messages.js";

const router = Router();

// ============================================================================
// A. LOCATION API (PUBLIC) - WITH AUTO TRIM
// ============================================================================

// 1. Get All Provinces
router.get(
  "/provinces",
  withQuery(async (req, res, pool) => {
    const result = await pool.query(
      "SELECT * FROM provinces ORDER BY name ASC"
    );

    // Trim semua kolom string
    const data = result.rows.map((row) => ({
      id: row.id.trim(),
      name: row.name.trim(),
    }));

    res.json(data);
  })
);

// 2. Get Regencies by Province ID
router.get(
  "/regencies",
  withQuery(async (req, res, pool) => {
    const { province_id } = req.query;

    if (!province_id)
      return res.status(400).json({ message: "province_id required" });

    const result = await pool.query(
      "SELECT * FROM regencies WHERE province_id = $1 ORDER BY name ASC",
      [province_id]
    );

    // Trim data
    const data = result.rows.map((row) => ({
      id: row.id.trim(),
      name: row.name.trim(),
    }));

    res.json(data);
  })
);

// 3. Get Districts by Regency ID
router.get(
  "/districts",
  withQuery(async (req, res, pool) => {
    const { regency_id } = req.query;

    if (!regency_id)
      return res.status(400).json({ message: "regency_id required" });

    const result = await pool.query(
      "SELECT * FROM districts WHERE regency_id = $1 ORDER BY name ASC",
      [regency_id]
    );

    // Trim data
    const data = result.rows.map((row) => ({
      id: row.id.trim(),
      name: row.name.trim(),
    }));

    res.json(data);
  })
);

// 4. Get Villages by District ID
router.get(
  "/villages",
  withQuery(async (req, res, pool) => {
    const { district_id } = req.query;

    if (!district_id)
      return res.status(400).json({ message: "district_id required" });

    const result = await pool.query(
      "SELECT * FROM villages WHERE district_id = $1 ORDER BY name ASC",
      [district_id]
    );

    // Trim data
    const data = result.rows.map((row) => ({
      id: row.id.trim(),
      name: row.name.trim(),
    }));

    res.json(data);
  })
);

// ============================================================================
// B. USER ADDRESS CRUD (PROTECTED)
// ============================================================================

// 1. Get User Addresses
router.get(
  "/my-addresses",
  authorize("user", "admin"),
  withQuery(async (req, res, pool) => {
    const userId = req.user.id;

    // Join dengan tabel wilayah agar frontend mendapat nama lengkap (bukan cuma ID)
    const query = `
      SELECT 
        a.*,
        p.name as province_name,
        r.name as regency_name,
        d.name as district_name,
        v.name as village_name
      FROM addresses a
      LEFT JOIN provinces p ON a.province_id = p.id
      LEFT JOIN regencies r ON a.regency_id = r.id
      LEFT JOIN districts d ON a.district_id = d.id
      LEFT JOIN villages v ON a.village_id = v.id
      WHERE a.user_id = $1
      ORDER BY a.is_primary DESC, a.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  })
);

// 2. Save / Create Address
router.post(
  "/save-address",
  authorize("user", "admin"),
  withTransaction(async (req, res, client) => {
    const userId = req.user.id;
    const {
      id,
      title,
      recipient_name,
      phone,
      province_id,
      regency_id,
      district_id,
      village_id,
      detail,
      postal_code,
      is_primary,
    } = req.body;

    // 1. Validasi Input
    if (!recipient_name || !phone || !detail || !village_id) {
      return res.status(400).json({ message: "Data alamat tidak lengkap" });
    }

    // 2. Ambil API Key Shipping
    const configResult = await client.query(
      `SELECT value FROM configurations WHERE key = 'shipping_api'`
    );
    if (configResult.rows.length === 0) {
      throw new Error("Konfigurasi API Shipping belum diatur.");
    }
    const apiKey = configResult.rows[0].value;

    // 3. Ambil Detail Wilayah (Kecamatan & Kota) untuk Pencarian Akurat
    const locationQuery = `
      SELECT 
        v.name as village_name, 
        d.name as district_name, 
        r.name as regency_name
      FROM villages v
      JOIN districts d ON v.district_id = d.id
      JOIN regencies r ON d.regency_id = r.id
      WHERE v.id = $1
    `;

    const locationResult = await client.query(locationQuery, [village_id]);
    if (locationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Wilayah tidak ditemukan di database." });
    }

    const loc = locationResult.rows[0];

    // 4. Cari Location ID ke API RajaOngkir
    // Format Search: "Kecamatan [Spasi] Kota"
    const searchString = `${loc.district_name} ${loc.regency_name}`;
    const searchEncoded = encodeURIComponent(searchString.toLowerCase());

    const searchUrl = `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${searchEncoded}&limit=1`;

    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        key: apiKey,
      },
    });

    if (!searchResponse.ok) {
      throw new Error("Gagal menghubungi server shipping.");
    }

    const searchResult = await searchResponse.json();

    if (
      !searchResult.data ||
      !Array.isArray(searchResult.data) ||
      searchResult.data.length === 0
    ) {
      return res.status(404).json({
        message: `Lokasi '${loc.district_name}' tidak terdeteksi oleh kurir. Coba cek data wilayah.`,
      });
    }

    // ID Lokasi untuk Ongkir
    const shippingId = searchResult.data[0].id;

    // ==================================================================
    // 5. FITUR BARU: Update Config Toko Jika Admin
    // ==================================================================
    // Cek role user saat ini di database untuk keamanan
    const userRoleCheck = await client.query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );
    const currentUserRole = userRoleCheck.rows[0]?.role;

    if (currentUserRole === "admin") {
      // Jika Admin mengubah alamatnya, kita asumsikan itu adalah Alamat Toko (Origin)
      await client.query(
        "UPDATE configurations SET value = $1, updated_at = NOW() WHERE key = 'shipping_origin'",
        [shippingId]
      );
    }
    // ==================================================================

    // 6. Logic Primary Address
    let finalIsPrimary = is_primary || false;

    // Auto Primary jika ini alamat pertama
    if (!id) {
      const countCheck = await client.query(
        "SELECT 1 FROM addresses WHERE user_id = $1 LIMIT 1",
        [userId]
      );
      if (countCheck.rows.length === 0) finalIsPrimary = true;
    }

    // Reset primary alamat lain
    if (finalIsPrimary) {
      await client.query(
        "UPDATE addresses SET is_primary = false WHERE user_id = $1",
        [userId]
      );
    }

    // 7. Simpan Alamat (Insert/Update)
    if (id) {
      // --- UPDATE ---
      const checkOwner = await client.query(
        "SELECT id FROM addresses WHERE id = $1 AND user_id = $2",
        [id, userId]
      );
      if (checkOwner.rows.length === 0) {
        return res.status(403).json({ message: "Akses ditolak." });
      }

      const updateQuery = `
        UPDATE addresses SET
          title = $1, recipient_name = $2, phone = $3,
          province_id = $4, regency_id = $5, district_id = $6, village_id = $7,
          detail = $8, postal_code = $9, is_primary = $10, shipping_id = $11
        WHERE id = $12
      `;

      await client.query(updateQuery, [
        title || "Rumah",
        recipient_name,
        phone,
        province_id,
        regency_id,
        district_id,
        village_id,
        detail,
        postal_code,
        finalIsPrimary,
        shippingId,
        id,
      ]);

      return res.json({ message: "Alamat berhasil diperbarui." });
    } else {
      // --- CREATE ---
      const insertQuery = `
        INSERT INTO addresses (
          user_id, title, recipient_name, phone,
          province_id, regency_id, district_id, village_id,
          detail, postal_code, is_primary, shipping_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      await client.query(insertQuery, [
        userId,
        title || "Rumah",
        recipient_name,
        phone,
        province_id,
        regency_id,
        district_id,
        village_id,
        detail,
        postal_code,
        finalIsPrimary,
        shippingId,
      ]);

      return res.status(201).json({ message: "Alamat berhasil ditambahkan." });
    }
  })
);

// 3. Delete Address
router.delete(
  "/delete-address",
  authorize("user", "admin"),
  withTransaction(async (req, res, client) => {
    const userId = req.user.id;
    const { id } = req.query;

    if (!id) return res.status(400).json({ message: "ID required" });

    // Cek kepemilikan
    const check = await client.query(
      "SELECT is_primary FROM addresses WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Alamat tidak ditemukan" });
    }

    // Cegah hapus alamat utama jika masih ada alamat lain
    if (check.rows[0].is_primary) {
      // Cek apakah masih ada alamat lain
      const otherAddr = await client.query(
        "SELECT count(*) FROM addresses WHERE user_id = $1",
        [userId]
      );
      if (parseInt(otherAddr.rows[0].count) > 1) {
        return res.status(400).json({
          message:
            "Tidak bisa menghapus alamat utama. Set alamat lain sebagai utama terlebih dahulu.",
        });
      }
    }

    await client.query("DELETE FROM addresses WHERE id = $1", [id]);
    res.json({ message: msg.removed });
  })
);

export default router;
