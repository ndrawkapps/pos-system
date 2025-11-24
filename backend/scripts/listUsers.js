const pool = require('../config/database');
(async ()=>{
  try{
    const [rows] = await pool.query('SELECT id,username,full_name,role_id,is_active FROM users');
    console.log(JSON.stringify(rows,null,2));
  }catch(e){console.error('ERR',e.message); process.exit(1);} finally { try{await pool.end();}catch(e){} }
})();
