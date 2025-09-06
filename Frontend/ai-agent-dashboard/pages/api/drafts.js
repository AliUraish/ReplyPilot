export default async function handler(req, res) {
  try {
    const { action } = req.query || {};
    const method = req.method || 'GET';
    const routes = {
      list: require('../../backend/api/drafts/list.js'),
      get: require('../../backend/api/drafts/get.js'),
      approve: require('../../backend/api/drafts/approve.js'),
      reject: require('../../backend/api/drafts/reject.js'),
      'approve-bulk': require('../../backend/api/drafts/approve-bulk.js'),
      'reject-bulk': require('../../backend/api/drafts/reject-bulk.js'),
      redraft: require('../../backend/drafts/redraft.js'),
    };
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
}
