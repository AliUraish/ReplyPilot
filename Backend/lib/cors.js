function applyCors(req, res) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-User-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

module.exports = { applyCors };

