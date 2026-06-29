import https from 'https';

https.get('https://tienich.ite.id.vn/7hncue', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body start:', data.slice(0, 150)));
}).on('error', (e) => {
  console.error(e);
});
