import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendActivationEmail } from "../../utils/sendemail.js";
import { authorize } from "../../middleware/authorize.js";
// Import wrapper yang sudah dibuat
import { withTransaction, withQuery } from "../../utils/dbWrapper.js";

const router = Router();

// --- 1. SIGNUP (DAFTAR) ---
// Menggunakan withTransaction karena ada INSERT (Write Operation)
router.post(
  "/signup",
  withTransaction(async (req, res, client) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Lengkapi data yang diperlukan!" });
    }

    // Cek email duplikat
    // Note: client sudah dalam posisi 'BEGIN', jadi aman langsung query
    const check = await client.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (check.rows.length > 0) {
      // Kita cukup return response error.
      // Wrapper akan tetap melakukan COMMIT (karena tidak ada error yang di-throw),
      // tapi karena kita belum melakukan INSERT apapun, commit ini aman (harmless).
      return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Generate code & expired time (24 jam dari sekarang)
    const activationCode = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Kirim email
    await sendActivationEmail(email, name, activationCode);

    // Simpan user
    await client.query(
      `INSERT INTO users 
     (name, email, password, phone, activation_code, activation_expires, is_active) 
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [name, email, hashed, phone, activationCode, activationExpires]
    );

    // Tidak perlu manual COMMIT atau release, wrapper yang mengurusnya.
    res.status(201).json({
      message:
        "Registrasi berhasil. Silakan cek email (inbox/spam) untuk aktivasi akun.",
    });
  })
);

// --- 2. ACTIVATION (AKTIVASI AKUN) ---
// Menggunakan withTransaction karena ada UPDATE (Write Operation)
// Meskipun method-nya GET, tapi sifatnya mengubah data di DB.
router.post(
  "/activate",
  withTransaction(async (req, res, client) => {
    const { code } = req.query;

    // Cari user berdasarkan kode
    const check = await client.query(
      `SELECT * FROM users WHERE activation_code = $1 AND activation_expires > NOW()`,
      [code]
    );

    if (check.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Kode aktivasi tidak valid atau sudah kadaluarsa." });
    }

    // Update user menjadi aktif
    await client.query(
      `UPDATE users SET is_active = true, activation_code = NULL, activation_expires = NULL WHERE id = $1`,
      [check.rows[0].id]
    );

    res
      .status(200)
      .json({ message: "Akun berhasil diaktifkan. Silakan login." });
  })
);

// --- 3. SIGNIN (LOGIN) ---
// Menggunakan withQuery karena hanya SELECT (Read Operation)
// Parameter ke-3 adalah 'pool' (bukan client transaksi)
router.post(
  "/signin",
  withQuery(async (req, res, pool) => {
    const { email, password } = req.body;

    // 1. Cari user
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Email atau password salah!" });
    }

    const user = result.rows[0];

    // 2. Cek status aktif
    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Akun belum diaktifkan. Silakan cek email Anda." });
    }

    // 3. Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email atau password salah!" });
    }

    // 4. Buat Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Kirim Token via Cookie
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: sevenDays,
    });

    res.status(200).json({ message: "Login berhasil" });
  })
);

// --- 4. Load User ---
// Tidak perlu wrapper DB karena logic-nya tidak akses DB di sini
// (Akses DB sudah dilakukan di middleware 'authorize')
router.get(
  "/load-user",
  authorize("admin", "user"),
  withQuery(async (req, res, pool) => {
    // 1. Ambil user dasar dari middleware authorize
    const user = { ...req.user }; // Copy object agar aman

    // 2. Query untuk mengambil daftar alamat user ini
    // Menggunakan pool query (sesuaikan dengan cara koneksi db anda)
    const addressResult = await pool.query(
      ` SELECT 
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
      ORDER BY a.is_primary DESC, a.created_at DESC`,
      [user.id]
    );

    // 3. Masukkan data alamat ke object user
    user.addresses = addressResult.rows;

    // 4. Bersihkan data sensitif
    delete user.password;
    delete user.activation_code;
    delete user.activation_expires;

    res.status(200).json(user);
  })
);

// --- 5. LOGOUT ---
// Tidak perlu wrapper DB
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout berhasil" });
});

export default router;
