import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendActivationEmail, sendResetEmail } from "../../utils/sendemail.js";
import { authorize } from "../../middleware/authorize.js";
import { withTransaction, withQuery } from "../../utils/dbWrapper.js";

const router = Router();

// --- 1. SIGNUP (DAFTAR) ---
router.post(
  "/signup",
  withTransaction(async (req, res, client) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Lengkapi data yang diperlukan!" });
    }

    // 1. Ambil konfigurasi domain
    const configResult = await client.query(
      `SELECT value FROM configurations WHERE key = 'domain'`
    );
    if (configResult.rows.length === 0) {
      throw new Error("Konfigurasi domain belum diatur.");
    }
    const url = configResult.rows[0].value;

    // 2. Cek email duplikat
    const check = await client.query(`SELECT id FROM users WHERE email = $1`, [
      email,
    ]);

    if (check.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    const hashed = await bcrypt.hash(password, 12);

    // 3. Generate code & expired time
    const activationCode = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Simpan user ke Database TERLEBIH DAHULU
    await client.query(
      `INSERT INTO users 
     (name, email, password, phone, activation_code, activation_expires, is_active) 
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [name, email, hashed, phone, activationCode, activationExpires]
    );

    // 5. Kirim email SETELAH data berhasil di-insert
    // Jika fungsi ini error (misal SMTP mati), transaction akan Rollback,
    // sehingga user yang baru dibuat di atas akan otomatis dihapus.
    await sendActivationEmail(email, name, activationCode, url);

    res.status(201).json({
      message:
        "Registrasi berhasil. Silakan cek email (inbox/spam) untuk aktivasi akun.",
    });
  })
);

// --- 2. ACTIVATION (AKTIVASI AKUN) ---
router.post(
  "/activate",
  withTransaction(async (req, res, client) => {
    const { code } = req.query;

    const check = await client.query(
      `SELECT id FROM users WHERE activation_code = $1 AND activation_expires > NOW()`,
      [code]
    );

    if (check.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Kode aktivasi tidak valid atau sudah kadaluarsa." });
    }

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
router.post(
  "/signin",
  withQuery(async (req, res, pool) => {
    const { email, password } = req.body;

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Email atau password salah!" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Akun belum diaktifkan. Silakan cek email Anda." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email atau password salah!" });
    }

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

    user.addresses = addressResult.rows;

    delete user.password;
    delete user.activation_code;
    delete user.activation_expires;

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: sevenDays,
    });

    res.status(200).json(user);
  })
);

// --- 4. Load User ---
router.get(
  "/load-user",
  authorize("admin", "user"),
  withQuery(async (req, res, pool) => {
    const user = { ...req.user };

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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

    user.addresses = addressResult.rows;

    delete user.password;
    delete user.activation_code;
    delete user.activation_expires;

    res.status(200).json(user);
  })
);

// --- 5. Update Profile ---
router.put(
  "/update-profile",
  authorize("admin", "user"),
  withTransaction(async (req, res, client) => {
    // Kita ambil ID dari token (req.user.id) demi keamanan,
    // agar user tidak bisa memanipulasi ID orang lain via body.
    const userId = req.user.id;
    const { name, phone, email, password } = req.body;

    // 1. Validasi input wajib
    if (!name || !email) {
      return res.status(400).json({ message: "Nama dan Email wajib diisi!" });
    }

    // 2. Cek Unik Email
    // (Jika email berubah, pastikan tidak dipakai user lain)
    const emailCheck = await client.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Email sudah digunakan oleh pengguna lain!" });
    }

    // 3. Logic Update (Dengan atau Tanpa Ganti Password)
    if (password && password.trim() !== "") {
      // Jika password diisi, hash password baru
      const hashedPassword = await bcrypt.hash(password, 12);

      await client.query(
        `UPDATE users 
         SET name = $1, phone = $2, email = $3, password = $4 
         WHERE id = $5`,
        [name, phone, email, hashedPassword, userId]
      );
    } else {
      // Jika password kosong, update data diri saja
      await client.query(
        `UPDATE users 
         SET name = $1, phone = $2, email = $3 
         WHERE id = $4`,
        [name, phone, email, userId]
      );
    }

    // 4. Ambil data user terbaru untuk dikembalikan (Opsional, tapi good practice)
    // Redux Query tag 'Auth' akan invalid, jadi frontend otomatis fetch ulang load-user.
    // Namun kita tetap perlu return message agar toast di frontend muncul.

    res.status(200).json({ message: "Profil berhasil diperbarui!" });
  })
);

// --- 6. LOGOUT ---
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout berhasil" });
});

// --- 7. FORGOT PASSWORD (REQUEST LINK) ---
router.post(
  "/forgot-password",
  withTransaction(async (req, res, client) => {
    const { email } = req.body;

    // 1. Cek user
    const check = await client.query(
      "SELECT id, name FROM users WHERE email = $1 AND is_active = true",
      [email]
    );

    if (check.rows.length === 0) {
      // Return 200 palsu agar tidak bocor info email valid/tidak (security best practice)
      // atau return 404 jika ingin eksplisit (tapi kurang aman)
      return res.status(200).json({
        message: "Jika email terdaftar, link reset password akan dikirim.",
      });
    }

    const user = check.rows[0];

    // 2. Generate Token & Expiry (1 Jam)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 jam

    // 3. Simpan ke DB
    await client.query(
      `UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    // 4. Ambil Config Domain untuk Link
    const configResult = await client.query(
      `SELECT value FROM configurations WHERE key = 'domain'`
    );
    const domain = configResult.rows[0].value;

    // Link mengarah ke Frontend: /reset-password?token=xxxx
    const resetLink = `${domain}/reset-password?token=${resetToken}`;

    // 5. Kirim Email
    await sendResetEmail(email, user.name, resetLink);

    res.status(200).json({
      message: "Jika email terdaftar, link reset password akan dikirim.",
    });
  })
);

// --- 8. RESET PASSWORD (SUBMIT NEW PASSWORD) ---
router.put(
  "/reset-password",
  withTransaction(async (req, res, client) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Data tidak lengkap." });
    }

    // 1. Validasi Token & Expiry
    const check = await client.query(
      `SELECT id FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > NOW()`,
      [token]
    );

    if (check.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Token tidak valid atau sudah kadaluarsa." });
    }

    const userId = check.rows[0].id;
    const hashed = await bcrypt.hash(newPassword, 12);

    // 2. Update Password & Hapus Token
    await client.query(
      `UPDATE users 
       SET password = $1, reset_password_token = NULL, reset_password_expires = NULL 
       WHERE id = $2`,
      [hashed, userId]
    );

    res
      .status(200)
      .json({ message: "Password berhasil diubah. Silakan login." });
  })
);

export default router;
