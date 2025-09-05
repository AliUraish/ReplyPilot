const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { appendEvent } = require('../../lib/events');

module.exports = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

    const { data: draft, error: dErr } = await supabase
      .from('draft')
      .select('id, account:account(id, user_id), status')
      .eq('id', id).maybeSingle();
    if (dErr) throw dErr;
    if (!draft || draft.account.user_id !== userId) return res.status(404).json({ ok: false, error: 'Not found' });
    if (draft.status !== 'pending') return res.status(400).json({ ok: false, error: 'Not pending' });

    await supabase.from('draft').update({ status: 'rejected', rejected_at: new Date().toISOString() }).eq('id', id);
    await appendEvent(draft.account.id, 'draft.deleted', { draft_id: id, status: 'rejected' });
    res.json({ ok: true });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

