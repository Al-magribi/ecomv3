import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";

app.listen(process.env.PORT || 2090, async () => {
  try {
    console.log(`Server is running on port ${process.env.PORT}`);

    await pool;
  } catch (error) {
    console.log(`connection is error: ${error}`);
  }
});
