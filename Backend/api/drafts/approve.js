const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { postReply } = require('../../lib/x');
const { appendEvent } = require('../../lib/events');

module.exports = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const { id } = req.query || {};
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

    const { data: draft, error: dErr } = await supabase
      .from('draft')
      .select('*, account:account(id, user_id), tokens:x_tokens(access_token)')
      .eq('id', id).maybeSingle();
    if (dErr) throw dErr;
    if (!draft || draft.account.user_id !== userId) return res.status(404).json({ ok: false, error: 'Not found' });
    if (draft.status !== 'pending') return res.status(400).json({ ok: false, error: 'Not pending' });

    const text = (body.reply_override && String(body.reply_override).trim()) || String(draft.suggested_reply || '').trim();
    if (!text) return res.status(400).json({ ok: false, error: 'Empty reply' });

    try {
      await postReply({ accessToken: draft.tokens.access_token, text, inReplyToTweetId: draft.tweet_id });
    } catch (e) {
      await supabase.from('draft').update({ status: 'failed', error: String(e) }).eq('id', id);
      await appendEvent(draft.account.id, 'draft.updated', { draft_id: id, status: 'failed' });
      throw e;
    }

    await supabase.from('draft').update({ status: 'posted', posted_at: new Date().toISOString() }).eq('id', id);
    await appendEvent(draft.account.id, 'draft.updated', { draft_id: id, status: 'posted' });
    res.json({ ok: true });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

