import jwt from "jsonwebtoken";

// Middleware Socket.IO untuk Verifikasi Token
export const socketAuth = (socket, next) => {
  // Ambil token dari properti 'auth' yang dikirim klien
  const token = socket.handshake.auth.token;

  if (!token) {
    // Pengguna belum login. Biarkan mereka terhubung sebagai anonim.
    console.log("User tanpa id terkoneksi");
    return next();
  }

  try {
    // Verifikasi Token
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // Lampirkan data user ke objek socket
    socket.user = user;

    console.log(`User authenticated: ${user.id}`);
    next(); // Lanjutkan koneksi
  } catch (error) {
    console.error(`Token Error: ${error.message}`);
    // Token tidak valid/expired. Tetap izinkan koneksi, tetapi tanpa data user.
  }
};
