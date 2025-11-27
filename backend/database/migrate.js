const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const runMigrations = async () => {
  let connection;

  try {
    console.log("🔄 Starting database migration...");
    console.log("📡 Connecting to database...");

    connection = await pool.getConnection();
    console.log("✅ Database connection established");

    console.log("🔄 Starting database migration...");

    // Create roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'roles' created/verified");

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        role_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);
    console.log("✅ Table 'users' created/verified");

    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'categories' created/verified");

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category_id INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(255),
        stock INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    console.log("✅ Table 'products' created/verified");

    // Create shifts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        modal_awal DECIMAL(10,2) NOT NULL,
        total_cash DECIMAL(10,2) DEFAULT 0,
        total_non_cash DECIMAL(10,2) DEFAULT 0,
        cash_in DECIMAL(10,2) DEFAULT 0,
        cash_out DECIMAL(10,2) DEFAULT 0,
        expected_cash DECIMAL(10,2) DEFAULT 0,
        actual_cash DECIMAL(10,2) DEFAULT 0,
        difference DECIMAL(10,2) DEFAULT 0,
        status ENUM('open', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'shifts' created/verified");

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shift_id INT NOT NULL,
        user_id INT NOT NULL,
        order_type ENUM('Dine-In', 'Take Away', 'GoFood', 'GrabFood', 'ShopeeFood') NOT NULL,
        table_number VARCHAR(50),
        payment_method ENUM('Tunai', 'QRIS', 'Online Order', 'Pink99', 'Kedai', 'Bpk/Ibu') NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2),
        change_amount DECIMAL(10,2),
        transaction_note TEXT,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shift_id) REFERENCES shifts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'transactions' created/verified");

    // Create transaction_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        item_note TEXT,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    console.log("✅ Table 'transaction_items' created/verified");

    // Create cash_flows table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cash_flows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shift_id INT NOT NULL,
        type ENUM('in', 'out') NOT NULL,
        name VARCHAR(200) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shift_id) REFERENCES shifts(id)
      )
    `);
    console.log("✅ Table 'cash_flows' created/verified");

    // Create cash_flow_audit table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cash_flow_audit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cash_flow_id INT,
        shift_id INT,
        performed_by INT,
        action VARCHAR(50),
        type VARCHAR(10),
        amount DECIMAL(15,2),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'cash_flow_audit' created/verified");

    // Create held_orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS held_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shift_id INT NOT NULL,
        user_id INT NOT NULL,
        order_type VARCHAR(50),
        table_number VARCHAR(50),
        items JSON NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        transaction_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shift_id) REFERENCES shifts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log("✅ Table 'held_orders' created/verified");

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'settings' created/verified");

    // Seed default roles
    const [roles] = await connection.query(
      "SELECT COUNT(*) as count FROM roles"
    );
    if (roles[0].count === 0) {
      await connection.query(`
        INSERT INTO roles (name, permissions) VALUES 
        ('admin', JSON_ARRAY('all')),
        ('kasir', JSON_ARRAY('kasir', 'riwayat', 'products_view', 'categories_view'))
      `);
      console.log("✅ Default roles inserted");
    } else {
      console.log("ℹ️  Roles already exist, skipping seed");
    }

    // Seed default admin user
    const [users] = await connection.query(
      "SELECT COUNT(*) as count FROM users WHERE username = 'admin'"
    );
    if (users[0].count === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await connection.query(
        `
        INSERT INTO users (username, password, full_name, role_id) VALUES 
        ('admin', ?, 'Administrator', 1)
      `,
        [hashedPassword]
      );
      console.log(
        "✅ Default admin user created (username: admin, password: admin123)"
      );
    } else {
      console.log("ℹ️  Admin user already exists, skipping seed");
    }

    console.log("🎉 Database migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    console.error("📋 Error details:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log("🔌 Database connection released");
    }
  }
};

module.exports = runMigrations;
