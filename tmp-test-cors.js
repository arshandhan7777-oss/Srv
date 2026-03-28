const https = require('https');

const options = {
  hostname: 'srv-backend-psi.vercel.app',
  port: 443,
  path: '/api/faculty/homework/69c81fc', // fake id
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://srv-admin-gamma.vercel.app',
    'Access-Control-Request-Method': 'PUT',
    'Access-Control-Request-Headers': 'authorization,content-type'
  }
};

const req = https.request(options, res => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', e => {
  console.error(e);
});

req.end();
