-- Migration: Add discount fields to transaction_items table
-- Description: Add per-item discount support (percentage or nominal discount)
-- Date: 2024-12-02

ALTER TABLE transaction_items
ADD COLUMN discount_type ENUM('none', 'percentage', 'nominal') DEFAULT 'none' AFTER subtotal,
ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0.00 AFTER discount_type,
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER discount_value,
ADD COLUMN total DECIMAL(10,2) DEFAULT 0.00 AFTER discount_amount;
