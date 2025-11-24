const axios = require('axios');

(async ()=> {
  try {
    console.log('Logging in...');
    const login = await axios.post('http://localhost:5000/api/auth/login', { username: 'admin', password: 'admin123' }, { timeout: 5000 });
    console.log('Login response:', login.status);
    const token = login.data && login.data.data && login.data.data.token ? login.data.data.token : (login.data && login.data.token) || null;
    console.log('Token:', !!token);

    if (!token) {
      console.error('No token in login response:', login.data);
      process.exit(1);
    }

    console.log('Sending PUT /api/categories/1');
    const res = await axios.put('http://localhost:5000/api/categories/1', { name: 'Edited Category', description: 'Updated by test' }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    console.log('PUT status:', res.status);
    console.log('PUT data:', res.data);
  } catch (e) {
    console.error('ERROR', e && e.toString ? e.toString() : e);
    if (e.response) {
      try { console.error('RESP', e.response.status, e.response.data); } catch (er) { console.error(er); }
    }
    process.exit(1);
  }
})();
