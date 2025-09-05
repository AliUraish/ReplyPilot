const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { appendEvent } = require('../../lib/events');
const { applyCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const userId = await getSessionUserId(req);
    const { accountId } = req.query || {};
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    if (!accountId) return res.status(400).json({ ok: false, error: 'Missing accountId' });
    const { data: acc } = await supabase.from('account').select('id, user_id').eq('id', accountId).maybeSingle();
    if (!acc || acc.user_id !== userId) return res.status(404).json({ ok: false, error: 'Not found' });

    const patch = {};
    if (typeof body.tone === 'string') patch.tone = body.tone;
    if (typeof body.language === 'string') patch.language = body.language;
    if (typeof body.selected_model === 'string') patch.selected_model = body.selected_model;
    if (Array.isArray(body.blocklist)) patch.blocklist = body.blocklist;
    if (Array.isArray(body.allowlist)) patch.allowlist = body.allowlist;
    patch.account_id = accountId;

    const { data: up, error: uErr } = await supabase.from('settings').upsert(patch).select('*').maybeSingle();
    if (uErr) throw uErr;
    await appendEvent(accountId, 'settings.updated', { selected_model: up?.selected_model, tone: up?.tone, language: up?.language });
    res.json({ ok: true, settings: up });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};
