-- Migration: Update existing transaction_items with default discount values and calculate total
-- Description: Set default values for existing records and populate total column
-- Date: 2024-12-02

-- Update all existing records to have default discount values
UPDATE transaction_items 
SET 
  discount_type = 'none',
  discount_value = 0.00,
  discount_amount = 0.00,
  total = subtotal
WHERE discount_type IS NULL OR total IS NULL OR total = 0;
