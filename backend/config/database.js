const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

// Support Railway's public proxy connection string if provided (`MYSQL_PUBLIC_URL`),
// then `MYSQL_URL` / `MYSQL_URI` / `DB_URL`, and finally individual DB_* vars.
const mysqlUrl =
  process.env.MYSQL_PUBLIC_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_URI ||
  process.env.DB_URL;
if (mysqlUrl) {
  // mysql2 supports creating a pool from a connection string
  pool = mysql.createPool(mysqlUrl);
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pos_system",
    waitForConnections: true,
    connectionLimit: 3, // Reduced from 10 for memory optimization
    queueLimit: 0,
  });
}

module.exports = pool;
