import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Pastikan ini menggunakan Sandi Aplikasi
  },
});

// Send activation email
export const sendActivationEmail = async (email, name, activationCode, url) => {
  const activationUrl = `${url}/activation/${activationCode}`;

  const mailOptions = {
    from: process.env.SMTP_APP,
    to: email,
    subject: "Aktivasi Akun",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivasi Akun</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border: 1px solid #dddddd;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #007BFF;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .content {
      padding: 20px;
      color: #333333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      margin: 20px 0;
      padding: 10px 20px;
      background-color: #007BFF;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
    .footer {
      background-color: #f4f4f4;
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #888888;
    }
    @media (max-width: 600px) {
      .content {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Aktivasi Akun Anda</h1>
    </div>
    <div class="content">
      <p>Halo ${name},</p>
      <p>Terima kasih telah mendaftar di platform kami. Kami sangat senang Anda bergabung. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:</p>
      
      <div style="text-align: center;">
        <a href="${activationUrl}" class="button">Aktivasi Akun</a>
      </div>

      <p>Jika Anda memiliki pertanyaan, jangan ragu untuk membalas email ini. Kami di sini untuk membantu!</p>
      <p>Link ini akan kadaluarsa dalam 24 jam.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TOSERBA</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  // HAPUS try...catch di sini. Biarkan error dilempar ke router.
  await transporter.sendMail(mailOptions);
  return true; // Jika sukses
};
