const pool = require('../config/database');

(async () => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM categories');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('DB ERROR', err.message);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch(e){}
  }
})();
