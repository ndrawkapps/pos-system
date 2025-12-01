-- Migration: Add cash_flow permission to kasir role
-- Date: 2025-01-XX
-- Description: Allow kasir role to add and delete cash flow entries (pemasukan/pengeluaran)

-- Update kasir role permissions
UPDATE roles 
SET permissions = JSON_ARRAY('kasir', 'riwayat', 'products_view', 'categories_view', 'settings_printer', 'cash_flow')
WHERE name = 'kasir';

-- Verify the update
SELECT id, name, permissions FROM roles WHERE name = 'kasir';
