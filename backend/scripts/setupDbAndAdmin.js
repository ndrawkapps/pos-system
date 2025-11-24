require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'pos_system';

  try {
    // Connect without database to ensure DB exists
    const conn = await mysql.createConnection({ host, user, password, multipleStatements: true });
    console.log('Connected to MySQL server');

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log('Ensured database exists:', dbName);

    // Check if users table exists
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'`, [dbName]);
    const exists = rows[0].cnt > 0;
    if (!exists) {
      console.log('Tables not found, applying schema.sql...');
      const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
      // run schema against the new DB
      await conn.query(`USE \`${dbName}\`;` + sql);
      console.log('Schema applied');
    } else {
      console.log('Tables already exist, skipping schema apply');
    }

    await conn.end();

    // Now create a pool to update/insert admin
    const pool = mysql.createPool({ host, user, password, database: dbName, waitForConnections: true, connectionLimit: 5 });

    // Ensure admin role exists
    const [roles] = await pool.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
    let adminRoleId;
    if (roles.length === 0) {
      const [r] = await pool.query("INSERT INTO roles (name, permissions) VALUES ('admin', JSON_ARRAY('all'))");
      adminRoleId = r.insertId;
      console.log('Created admin role with id', adminRoleId);
    } else {
      adminRoleId = roles[0].id;
      console.log('Found admin role id', adminRoleId);
    }

    // Hash desired password
    const passwordPlain = 'admin123';
    const hash = await bcrypt.hash(passwordPlain, 10);

    // Update or insert admin user
    const [users] = await pool.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    if (users.length === 0) {
      const [r] = await pool.query('INSERT INTO users (username, password, full_name, role_id, is_active) VALUES (?, ?, ?, ?, ?)', ['admin', hash, 'Administrator', adminRoleId, 1]);
      console.log('Inserted admin user with id', r.insertId);
    } else {
      const userId = users[0].id;
      await pool.query('UPDATE users SET password = ?, is_active = 1 WHERE id = ?', [hash, userId]);
      console.log('Updated admin user id', userId, 'with new password');
    }

    await pool.end();

    console.log('Setup complete — admin credentials: admin / admin123');
  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
}

run();
