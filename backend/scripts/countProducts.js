const pool = require('../config/database');
(async ()=>{
  try{
    const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM products');
    console.log(rows[0]);
  }catch(e){console.error('ERR',e.message); process.exit(1);} finally { try{await pool.end();}catch(e){} }
})();
