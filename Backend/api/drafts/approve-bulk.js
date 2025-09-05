const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { postReply } = require('../../lib/x');
const { appendEvent } = require('../../lib/events');

module.exports = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const ids = Array.isArray(body.ids) ? body.ids.slice(0, 20) : [];
    const overrides = body.reply_overrides || {};
    if (ids.length === 0) return res.status(400).json({ ok: false, error: 'No ids' });

    const { data: drafts, error: dErr } = await supabase
      .from('draft')
      .select('id, status, tweet_id, suggested_reply, account:account(id, user_id), tokens:x_tokens(access_token)')
      .in('id', ids);
    if (dErr) throw dErr;

    const results = [];
    for (const d of drafts) {
      if (d.account.user_id !== userId || d.status !== 'pending') {
        results.push({ id: d.id, ok: false, error: 'not_allowed_or_not_pending' });
        continue;
      }
      const text = (overrides[d.id] && String(overrides[d.id]).trim()) || String(d.suggested_reply || '').trim();
      if (!text) {
        results.push({ id: d.id, ok: false, error: 'empty_reply' });
        continue;
      }
      try {
        await postReply({ accessToken: d.tokens.access_token, text, inReplyToTweetId: d.tweet_id });
        await supabase.from('draft').update({ status: 'posted', posted_at: new Date().toISOString() }).eq('id', d.id);
        await appendEvent(d.account.id, 'draft.updated', { draft_id: d.id, status: 'posted' });
        results.push({ id: d.id, ok: true });
      } catch (e) {
        await supabase.from('draft').update({ status: 'failed', error: String(e) }).eq('id', d.id);
        await appendEvent(d.account.id, 'draft.updated', { draft_id: d.id, status: 'failed' });
        results.push({ id: d.id, ok: false, error: String(e) });
      }
    }

    res.json({ ok: true, results });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

