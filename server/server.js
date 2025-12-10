import "dotenv/config";
import app from "./app.js";
// HAPUS import pool dari sini agar tidak auto-connect saat mode installer

const PORT = process.env.PORT || 2090; // Berikan fallback port jika env belum ada

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
