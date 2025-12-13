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
    subject: "Konfirmasi Pendaftaran akun",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; color: #4a5568; }
    .email-wrapper { width: 100%; background-color: #f4f7f6; padding: 40px 0; }
    .email-card { background-color: #ffffff; max-width: 500px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e1e4e8; }
    .email-header { background-color: #2b6cb0; padding: 30px; text-align: center; } /* Warna Biru Professional */
    .email-header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .email-body { padding: 35px 30px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 600; color: #2d3748; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 35px 0; }
    .btn { background-color: #3182ce; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3); }
    .btn:hover { background-color: #2b6cb0; }
    .info-box { background-color: #ebf8ff; border-left: 4px solid #4299e1; padding: 15px; font-size: 14px; color: #2c5282; margin-bottom: 25px; border-radius: 4px; }
    .link-fallback { margin-top: 25px; font-size: 12px; color: #718096; word-break: break-all; border-top: 1px solid #edf2f7; padding-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; background-color: #f4f7f6; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="email-header">
        <h1>Selamat Datang!</h1>
      </div>
      
      <div class="email-body">
        <div class="greeting">Halo, ${name} 👋</div>
        
        <p>Terima kasih telah mendaftar di <b>${senderName}</b>. Kami sangat senang Anda bergabung dengan kami.</p>
        
        <div class="info-box">
          Langkah terakhir untuk mengamankan dan mengaktifkan akun Anda adalah dengan memverifikasi alamat email ini.
        </div>

        <div class="btn-container">
          <a href="${activationUrl}" class="btn">Aktivasi Akun Saya</a>
        </div>

        <p>Jika Anda tidak merasa mendaftar di layanan kami, Anda dapat mengabaikan email ini dengan aman.</p>

        <div class="link-fallback">
          <p>Tombol di atas tidak berfungsi? Salin dan tempel tautan berikut ke browser Anda:</p>
          <a href="${activationUrl}" style="color: #3182ce; text-decoration: none;">${activationUrl}</a>
        </div>
      </div>
    </div>

    <div class="footer">
      Link ini valid selama 24 jam.<br>
      &copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.
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

export const sendResetEmail = async (email, name, resetLink) => {
  const config = await getSmtpConfig();

  if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
    throw new Error("Konfigurasi SMTP belum lengkap di Database.");
  }

  console.log(config);

  const port = parseInt(config.smtp_port);
  const isSecure = port === 465;

  // Setup Transporter (Sama dengan sendActivationEmail untuk konsistensi)
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: port,
    secure: isSecure,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  // Fallback nama pengirim
  const senderName = config.smtp_from_name || "System Support";
  const senderEmail = config.smtp_user;
  const fromSender = `"${senderName}" <${senderEmail}>`;

  const mailOptions = {
    from: fromSender,
    to: email,
    subject: "Reset Password - Action Required",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; }
    .email-wrapper { width: 100%; background-color: #f4f7f6; padding: 40px 0; }
    .email-card { background-color: #ffffff; max-width: 500px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e1e4e8; }
    .email-header { background-color: #2d3748; padding: 25px; text-align: center; }
    .email-header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
    .email-body { padding: 35px 30px; color: #4a5568; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { background-color: #e53e3e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s; box-shadow: 0 2px 5px rgba(229, 62, 62, 0.3); }
    .btn:hover { background-color: #c53030; }
    .security-note { background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; font-size: 13px; color: #742a2a; margin-top: 25px; border-radius: 4px; }
    .link-fallback { margin-top: 25px; font-size: 12px; color: #718096; word-break: break-all; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">
      <div class="email-header">
        <h1>Permintaan Reset Password</h1>
      </div>
      
      <div class="email-body">
        <div class="greeting">Halo, ${name}</div>
        <p>Kami menerima permintaan untuk mereset password akun Anda di <b>${senderName}</b>.</p>
        <p>Untuk membuat password baru, silakan klik tombol di bawah ini (Link ini hanya berlaku selama 1 jam):</p>
        
        <div class="btn-container">
          <a href="${resetLink}" class="btn">Reset Password Saya</a>
        </div>

        <div class="security-note">
          <strong>Penting:</strong> Jika Anda tidak merasa melakukan permintaan ini, mohon abaikan email ini. Akun Anda tetap aman dan password lama Anda tidak berubah.
        </div>

        <div class="link-fallback">
          <p>Tombol tidak berfungsi? Salin link di bawah ini ke browser Anda:</p>
          <a href="${resetLink}" style="color: #4299e1;">${resetLink}</a>
        </div>
      </div>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.<br>
      Email ini dikirim secara otomatis, mohon tidak membalas.
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    // Verifikasi koneksi sebelum mengirim
    await transporter.verify();
  } catch (err) {
    console.error("❌ SMTP Connection Failed (Reset Pass):", err.message);
    throw new Error(
      "Gagal terhubung ke server email. Silakan coba lagi nanti."
    );
  }

  await transporter.sendMail(mailOptions);
  return true;
};
