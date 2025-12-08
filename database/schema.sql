CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users
CREATE TABLE users (
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
);

-- Table: categories
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: products
CREATE TABLE products (
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
);

-- Table: shifts
CREATE TABLE shifts (
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
);

-- Table: transactions
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL,
  user_id INT NOT NULL,
  order_type ENUM('Dine-In', 'Take Away', 'GoFood', 'GrabFood', 'ShopeeFood') NOT NULL,
  table_number VARCHAR(50),
  payment_method ENUM('Tunai', 'QRIS', 'Online Order', 'Pink99', 'Car Wash', 'Kedai', 'Bpk/Ibu') NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_type ENUM('percentage', 'nominal', 'none') DEFAULT 'none',
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  transaction_note TEXT,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: transaction_items
CREATE TABLE transaction_items (
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
);

-- Table: cash_flows
CREATE TABLE cash_flows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL,
  type ENUM('in', 'out') NOT NULL,
  name VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

-- Table: cash_flow_audit (records deletions/changes to cash flows)
CREATE TABLE cash_flow_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cash_flow_id INT,
  shift_id INT,
  performed_by INT,
  action VARCHAR(50),
  type VARCHAR(10),
  amount DECIMAL(15,2),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: held_orders
CREATE TABLE held_orders (
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
);

-- Table: settings
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES 
('admin', JSON_ARRAY('all')),
('kasir', JSON_ARRAY('kasir', 'riwayat', 'products_view', 'categories_view', 'settings_printer', 'cash_flow'));

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, full_name, role_id) VALUES 
('admin', '$2b$10$xhash...', 'Administrator', 1);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES 
('app_name', 'Kedai Luwih99'),
('app_icon', '/default-icon.png'),
('printer_name', ''),
('printer_type', 'bluetooth'),
('address_line1', 'Jl Tegal Luwih Blok SS No. 19'),
('address_line2', 'Dalung Permai');