const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { appendEvent } = require('../../lib/events');
const { applyCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const userId = await getSessionUserId(req);
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 50) : [];
    if (ids.length === 0) return res.status(400).json({ ok: false, error: 'No ids' });

    const { data: drafts, error: dErr } = await supabase
      .from('draft')
      .select('id, status, account:account(id, user_id)')
      .in('id', ids);
    if (dErr) throw dErr;

    const allowed = drafts.filter(d => d.account.user_id === userId && d.status === 'pending').map(d => d.id);
    if (allowed.length) {
      await supabase.from('draft').update({ status: 'rejected', rejected_at: new Date().toISOString() }).in('id', allowed);
      for (const d of drafts.filter(dd => allowed.includes(dd.id))) {
        await appendEvent(d.account.id, 'draft.deleted', { draft_id: d.id, status: 'rejected' });
      }
    }

    res.json({ ok: true, updated: allowed.length });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

