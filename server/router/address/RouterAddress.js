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
      id, // Jika ada ID = Update, Null = Create
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

    // Validasi Basic
    if (!recipient_name || !phone || !detail || !district_id) {
      return res.status(400).json({ message: "Data alamat tidak lengkap" });
    }

    // Logic: Jika user set alamat ini sebagai primary,
    // maka set alamat lain milik user ini menjadi non-primary
    if (is_primary) {
      await client.query(
        "UPDATE addresses SET is_primary = false WHERE user_id = $1",
        [userId]
      );
    }

    if (id) {
      // --- UPDATE EXISTING ---
      // Pastikan alamat milik user yang login
      const checkOwner = await client.query(
        "SELECT id FROM addresses WHERE id = $1 AND user_id = $2",
        [id, userId]
      );

      if (checkOwner.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Alamat tidak ditemukan atau akses ditolak" });
      }

      const updateQuery = `
        UPDATE addresses SET
          title = $1, recipient_name = $2, phone = $3,
          province_id = $4, regency_id = $5, district_id = $6, village_id = $7,
          detail = $8, postal_code = $9, is_primary = $10
        WHERE id = $11
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
        is_primary || false,
        id,
      ]);

      return res.json({ message: msg.updated });
    } else {
      // --- CREATE NEW ---
      // Cek apakah ini alamat pertama? Jika ya, otomatis jadi primary
      const countCheck = await client.query(
        "SELECT count(*) FROM addresses WHERE user_id = $1",
        [userId]
      );
      const isFirst = parseInt(countCheck.rows[0].count) === 0;
      const finalIsPrimary = isFirst ? true : is_primary || false;

      const insertQuery = `
        INSERT INTO addresses (
          user_id, title, recipient_name, phone,
          province_id, regency_id, district_id, village_id,
          detail, postal_code, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
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
      ]);

      return res.status(201).json({ message: msg.created });
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
