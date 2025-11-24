const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function ensureCategoryForOid(oid) {
  const name = `imported:${oid}`;
  const [rows] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
  if (rows.length) return rows[0].id;
  const [res] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, `Imported category for oid ${oid}`]);
  return res.insertId;
}

async function importProducts(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(raw);
  let inserted = 0;
  const MAX_PRICE = 99999999.99;
  for (const p of items) {
    const name = p.name || null;
    if (!name) continue;
    let price = Number(p.price || 0);
    if (!Number.isFinite(price) || price < 0) price = 0;
    if (price > MAX_PRICE) {
      console.warn(`Capping price for "${name}" from ${price} to ${MAX_PRICE}`);
      price = MAX_PRICE;
    }
    let categoryOid = null;
    if (p.category && (p.category.$oid || typeof p.category === 'string')) {
      categoryOid = p.category.$oid || p.category;
    }
    let categoryId = 1; // default
    if (categoryOid) {
      try {
        categoryId = await ensureCategoryForOid(categoryOid);
      } catch (e) {
        console.error('Category insert error', e.message);
      }
    } else {
      // ensure at least one category exists and get its id
      const [rows] = await pool.query('SELECT id FROM categories LIMIT 1');
      if (rows.length) categoryId = rows[0].id;
      else {
        const [r] = await pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', ['Imported:default', 'Default imported category']);
        categoryId = r.insertId;
      }
    }

    try {
      // avoid duplicate by name
      const [exists] = await pool.query('SELECT id FROM products WHERE name = ? LIMIT 1', [name]);
      if (exists.length) {
        // skip duplicate
        continue;
      }
      await pool.query('INSERT INTO products (name, category_id, price) VALUES (?, ?, ?)', [name, categoryId, price]);
      inserted++;
    } catch (e) {
      console.error('Insert product error for', name, e.message);
    }
  }
  return inserted;
}

(async () => {
  // Try several likely locations for the provided attachment
  const candidates = [
    path.resolve(process.cwd(), '..', '..', 'test.products.json'),
    path.resolve(process.cwd(), '..', 'test.products.json'),
    path.resolve(process.cwd(), '..', '..', '..', 'test.products.json'),
    'C:/Users/ndraw/OneDrive/Dokumen/test.products.json',
    path.resolve(process.cwd(), 'test.products.json')
  ];
  const jsonPath = candidates.find(p => fs.existsSync(p));
  if (!jsonPath) {
    console.error('Attachment file not found in any candidate path, tried:', candidates.join(', '));
    process.exit(1);
  }
  try {
    const count = await importProducts(jsonPath);
    console.log('Inserted products:', count);
  } catch (err) {
    console.error('Import failed', err.message);
  } finally {
    try { await pool.end(); } catch(e){}
  }
})();
