const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { applyCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const userId = await getSessionUserId(req);
    const { accountId } = req.query || {};
    if (!accountId) return res.status(400).json({ ok: false, error: 'Missing accountId' });
    const { data: acc } = await supabase.from('account').select('id, user_id').eq('id', accountId).maybeSingle();
    if (!acc || acc.user_id !== userId) return res.status(404).json({ ok: false, error: 'Not found' });
    const { data: set } = await supabase.from('settings').select('*').eq('account_id', accountId).maybeSingle();
    res.json({ settings: set || null });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};
