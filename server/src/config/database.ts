import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10,
});

export const db = drizzle(pool);

export async function connectDB() {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL connected successfully");
  } catch (error) {
    console.error("MySQL connection failed:", error);
    process.exit(1);
  }
}
