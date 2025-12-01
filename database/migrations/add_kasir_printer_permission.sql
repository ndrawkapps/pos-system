-- Migration: Add settings_printer permission to kasir role
-- Date: 2025-12-01

-- Update kasir role to include settings_printer permission
UPDATE roles 
SET permissions = JSON_ARRAY('kasir', 'riwayat', 'products_view', 'categories_view', 'settings_printer')
WHERE name = 'kasir';

-- Verify update
SELECT name, permissions FROM roles WHERE name = 'kasir';
