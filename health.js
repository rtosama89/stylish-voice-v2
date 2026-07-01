module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'Stylish English Voice Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};
