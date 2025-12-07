import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const authorize = (...roles) => {
  return async (req, res, next) => {
    const client = await pool.connect();

    const { token } = req.cookies;

    try {
      if (!token) {
        return res.status(401).json({ message: "Akes tidak diizinkan" });
      }

      const decode = jwt.verify(token, process.env.JWT_SECRET);

      const foundUser = await client.query(
        `SELECT * FROM users WHERE id = $1`,
        [decode.id]
      );

      if (foundUser.rows.length === 0) {
        return res.status(401).json({ message: "Akses tidak diizinkan" });
      }

      const user = foundUser.rows[0];

      if (roles.length === 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Akses tidak diizinkan" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Akses tidak diizinkan" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Token tidak valid.",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token kadaluarsa. Silakan login kembali.",
        });
      }
      return res.status(500).json({
        message: "Internal server error.",
      });
    } finally {
      client.release();
    }
  };
};
