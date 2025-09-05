module.exports = async (req, res) => {
  try {
    const { action } = req.query || {};
    const method = req.method || 'GET';

    // Map actions to backend handlers
    const routes = {
      list: require('../Backend/api/drafts/list.js'),
      get: require('../Backend/api/drafts/get.js'),
      approve: require('../Backend/api/drafts/approve.js'),
      reject: require('../Backend/api/drafts/reject.js'),
      'approve-bulk': require('../Backend/api/drafts/approve-bulk.js'),
      'reject-bulk': require('../Backend/api/drafts/reject-bulk.js'),
      redraft: require('../Backend/drafts/redraft.js'),
    };

    // Default action by method for convenience
    const fallback = method === 'GET' ? 'list' : undefined;
    const handler = routes[action] || (fallback ? routes[fallback] : null);

    if (!handler) {
      res.statusCode = 400;
      return res.json({ ok: false, error: 'Unknown drafts action. Use ?action=list|get|approve|reject|approve-bulk|reject-bulk|redraft' });
    }
    return handler(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

