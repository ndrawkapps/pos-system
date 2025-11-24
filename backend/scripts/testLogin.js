const axios = require('axios');
(async ()=>{
  try{
    const r = await axios.post('http://localhost:5000/api/auth/login', { username: 'admin', password: 'admin123' }, { timeout: 5000 });
    console.log('STATUS', r.status);
    console.log(r.data);
  }catch(e){
    console.error('FULL ERROR', e && e.toString ? e.toString() : e);
    if (e.response) {
      try{ console.error('RESP', e.response.status, e.response.data); }catch(e){}
    }
    process.exit(1);
  }
})();
// testLogin.js - no longer needed. Use scripts/setupDbAndAdmin.js to prepare DB and admin user.
// This file is intentionally left blank.

