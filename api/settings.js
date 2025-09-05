module.exports = async (req, res) => {
  try {
    const method = req.method || 'GET';
    if (method === 'GET') {
      const getHandler = require('../Backend/settings/get.js');
      return getHandler(req, res);
    }
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const updateHandler = require('../Backend/settings/update.js');
      return updateHandler(req, res);
    }
    res.statusCode = 405;
    res.setHeader('Allow', 'GET,POST');
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

