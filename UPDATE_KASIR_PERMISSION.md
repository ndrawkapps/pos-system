# Manual Database Update untuk Kasir Role

Karena role kasir sudah ada di database production, perlu manual update permission.

## Via Zeabur MySQL Console atau phpMyAdmin:

```sql
-- Update kasir role permissions
UPDATE roles 
SET permissions = JSON_ARRAY('kasir', 'riwayat', 'products_view', 'categories_view', 'settings_printer')
WHERE name = 'kasir';

-- Verify
SELECT name, permissions FROM roles WHERE name = 'kasir';
```

## Expected Result:
```
name   | permissions
-------|---------------------------------------------------------
kasir  | ["kasir","riwayat","products_view","categories_view","settings_printer"]
```

## After Update:
1. Kasir role akan bisa akses menu "Pengaturan" di sidebar
2. Di halaman Pengaturan, kasir hanya lihat "Printer Settings"
3. Admin tetap lihat semua settings (Printer + Profile + System Info)

## Test:
1. Login sebagai kasir
2. Check menu Pengaturan muncul di sidebar
3. Click Pengaturan
4. Hanya tampil card Printer Settings (tidak ada Profile Settings)
