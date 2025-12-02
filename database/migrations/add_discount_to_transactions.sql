-- Migration: Add discount fields to transactions table
-- Date: 2025-12-02
-- Description: Add discount_type, discount_value, and discount_amount columns

-- Add discount columns
ALTER TABLE transactions 
ADD COLUMN discount_type ENUM('percentage', 'nominal', 'none') DEFAULT 'none' AFTER subtotal,
ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0 AFTER discount_type,
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER discount_value;

-- Verify the changes
DESCRIBE transactions;
