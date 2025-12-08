-- Migration: Add Car Wash payment method to transactions table
-- Description: Add 'Car Wash' option to payment_method ENUM
-- Date: 2024-12-08

ALTER TABLE transactions 
MODIFY COLUMN payment_method ENUM('Tunai', 'QRIS', 'Online Order', 'Pink99', 'Car Wash', 'Kedai', 'Bpk/Ibu') NOT NULL;
