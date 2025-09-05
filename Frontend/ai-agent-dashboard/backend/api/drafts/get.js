const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { applyCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const userId = await getSessionUserId(req);
    const { id } = req.query || {};
    if (!id) {
      res.statusCode = 400;
      return res.json({ ok: false, error: 'Missing id' });
    }

    const { data: draft, error: dErr } = await supabase
      .from('draft').select('*, account:account(user_id)').eq('id', id).maybeSingle();
    if (dErr) throw dErr;
    if (!draft || draft.account.user_id !== userId) {
      res.statusCode = 404;
      return res.json({ ok: false, error: 'Not found' });
    }
    delete draft.account;
    res.json({ draft });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

