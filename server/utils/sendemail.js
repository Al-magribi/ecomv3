import nodemailer from "nodemailer";
import pool from "../config/database.js";

const getSmtpConfig = async () => {
  const query = "SELECT key, value FROM configurations WHERE category = 'smtp'";
  const result = await pool.query(query);

  const config = result.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return config;
};

export const sendActivationEmail = async (email, name, activationCode, url) => {
  const config = await getSmtpConfig();

  if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
    throw new Error("Konfigurasi SMTP belum lengkap di Database.");
  }

  const port = parseInt(config.smtp_port);

  // LOGIKA: Jika port 465, gunakan SSL (secure: true). Selain itu false.
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: port,
    secure: isSecure,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
    // Konfigurasi tambahan untuk stabilitas koneksi
    tls: {
      rejectUnauthorized: false, // Mencegah error sertifikat
    },
    // Penambahan timeout agar tidak error "Greeting never received" terlalu cepat
    connectionTimeout: 10000, // 10 detik
    greetingTimeout: 10000, // 10 detik
    socketTimeout: 10000, // 10 detik
  });

  const activationUrl = `${url}/activation/${activationCode}`;

  // Fallback jika nama pengirim kosong
  const senderName = config.smtp_from_name;
  const senderEmail = config.smtp_user;
  const fromSender = `"${senderName}" <${senderEmail}>`;

  const mailOptions = {
    from: fromSender,
    to: email,
    subject: "Aktivasi Akun",
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd; }
    .btn { background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold;}
    .footer { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #333;">Selamat Datang, ${name}!</h2>
    <p>Terima kasih telah mendaftar di <b>${senderName}</b>. Langkah terakhir untuk mengaktifkan akun Anda adalah dengan mengklik tombol di bawah ini:</p>
    
    <div style="text-align: center;">
      <a href="${activationUrl}" class="btn">Aktivasi Akun Saya</a>
    </div>

    <p style="margin-top: 30px;">Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:</p>
    <p style="background: #eee; padding: 10px; word-break: break-all; font-family: monospace;">${activationUrl}</p>
    
    <div class="footer">
      <p>Link ini valid selama 24 jam.<br>&copy; ${new Date().getFullYear()} ${senderName}</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  // Coba verifikasi koneksi dulu (Opsional, untuk debugging di console server)
  try {
    await transporter.verify();
    console.log(`✅ SMTP Connected to ${config.smtp_host}:${port}`);
  } catch (err) {
    console.error("❌ SMTP Connection Failed:", err.message);
    // Kita throw error agar Transaction di RouterAuth melakukan ROLLBACK
    throw new Error(
      "Gagal terhubung ke server email. Silakan coba lagi nanti."
    );
  }

  await transporter.sendMail(mailOptions);
  return true;
};
