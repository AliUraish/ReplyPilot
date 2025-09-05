const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');

module.exports = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const { status = 'pending', limit = '20', order = 'recent', accountId } = req.query || {};

    let accountQuery = supabase.from('account').select('id').eq('user_id', userId);
    if (accountId) accountQuery = accountQuery.eq('id', accountId);
    const { data: accounts, error: accErr } = await accountQuery;
    if (accErr) throw accErr;
    const accountIds = (accounts || []).map(a => a.id);
    if (accountIds.length === 0) return res.json({ items: [], nextCursor: null });

    let q = supabase.from('draft').select('*').in('account_id', accountIds).eq('status', status);
    if (order === 'score') q = q.order('score', { ascending: false });
    else q = q.order('created_at', { ascending: false });
    q = q.limit(Math.min(100, Number(limit) || 20));
    const { data: items, error: err } = await q;
    if (err) throw err;

    res.json({ items, nextCursor: null });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

