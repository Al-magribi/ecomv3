import "dotenv/config";
import server from "./app.js";
import pool from "./config/database.js";

server.listen(process.env.PORT, async () => {
  try {
    console.log(`Server is running on port ${process.env.PORT}`);

    await pool;
  } catch (error) {
    console.log(`connection is error: ${error}`);
  }
});
