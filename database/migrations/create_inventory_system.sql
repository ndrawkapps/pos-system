-- Migration: Create Inventory Management System
-- Description: Add ingredients, product recipes, and stock movements tracking
-- Date: 2024-12-08

-- Table: ingredients (Bahan Baku)
CREATE TABLE IF NOT EXISTS ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL COMMENT 'kg, liter, pcs, porsi, gram, ml',
  current_stock DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT 'Current stock quantity',
  min_stock DECIMAL(10,3) DEFAULT 0 COMMENT 'Minimum stock alert threshold',
  cost_per_unit DECIMAL(10,2) DEFAULT 0 COMMENT 'Cost per unit for calculation',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: product_recipes (Resep Produk)
CREATE TABLE IF NOT EXISTS product_recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity_needed DECIMAL(10,3) NOT NULL COMMENT 'Quantity needed per serving',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_ingredient (product_id, ingredient_id)
);

-- Table: stock_movements (History Pergerakan Stok)
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_id INT NOT NULL,
  movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  stock_before DECIMAL(10,3) NOT NULL,
  stock_after DECIMAL(10,3) NOT NULL,
  reference_type ENUM('transaction', 'purchase', 'adjustment', 'waste') NULL,
  reference_id INT NULL,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Index for performance
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id, created_at);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_product_recipes_product ON product_recipes(product_id);
CREATE INDEX idx_ingredients_active ON ingredients(is_active);
