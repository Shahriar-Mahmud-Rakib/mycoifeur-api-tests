require('dotenv').config();
const { request } = require('@playwright/test');

(async () => {
  const req = await request.newContext();
  const ts = Date.now().toString().slice(-8);
  const payload = {
    email: `auto_user_${ts}@example.com`,
    password: 'Password123456',
    fname: 'Auto',
    lname: 'User',
    phone: `96655${ts.slice(-7)}`,
    type_user: 'user',
    country_id: '1',
    city_id: '1',
  };

  const BASE_URL = process.env.BASE_URL || 'https://zk2a6jfr01.execute-api.ap-southeast-5.amazonaws.com';
  
  console.log('Registering user...');
  const res = await req.post(`${BASE_URL}/api/v1/auth/user/register`, {
    headers: { 'x-custom-lang': 'en', 'x-app-version': '1.1.4', 'x-platform': 'android' },
    multipart: payload,
  });
  
  console.log('Register status:', res.status());
  console.dir(await res.json().catch(()=>({})), { depth: null });

  console.log('Verifying user with 1234...');
  const verifyRes = await req.post(`${BASE_URL}/api/v1/auth/verify-code`, {
    headers: { 'x-custom-lang': 'en', 'x-app-version': '1.1.4', 'x-platform': 'android' },
    data: { phone: payload.phone, code: '1234', countryCode: '966', typeUser: 'user' }
  });
  
  console.log('Verify status:', verifyRes.status());
  console.dir(await verifyRes.json().catch(()=>({})), { depth: null });
})();
