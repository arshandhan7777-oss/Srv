const https = require('https');

const data = JSON.stringify({
  subject: "Science",
  title: "wertyu",
  description: "defghj",
  dueDate: "2026-03-29"
});

const options = {
  hostname: 'srv-backend-psi.vercel.app',
  port: 443,
  path: '/api/faculty/homework/undefined',
  method: 'PUT',
  headers: {
    'Origin': 'https://srv-admin-gamma.vercel.app',
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer fake_token_for_testing'
  }
};

const req = https.request(options, res => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
});

req.on('error', e => {});
req.write(data);
req.end();
