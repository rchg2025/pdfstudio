import https from 'https';

https.get('https://tienich.ite.id.vn/api/redirect?alias=7hncue', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
