const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { generateDraft } = require('../../lib/ai');
const { appendEvent } = require('../../lib/events');

module.exports = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const { id } = req.query || {};
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    if (!id) return res.status(400).json({ ok: false, error: 'Missing id' });

    const { data: draft, error: dErr } = await supabase
      .from('draft')
      .select('id, tweet_text, author_handle, account:account(id, user_id, handle), settings:settings(selected_model, tone, language)')
      .eq('id', id).maybeSingle();
    if (dErr) throw dErr;
    if (!draft || draft.account.user_id !== userId) return res.status(404).json({ ok: false, error: 'Not found' });

    const instructions = typeof body.instructions === 'string' ? body.instructions.trim() : '';
    const tone = instructions ? `${draft.settings?.tone || ''}. Also: ${instructions}`.trim() : draft.settings?.tone;
    const model = draft.settings?.selected_model || process.env.AI_MODEL || 'gpt-5';
    const language = draft.settings?.language || 'en';

    const suggested = await generateDraft({ model, handle: draft.account.handle, tone, tweetText: draft.tweet_text, authorHandle: draft.author_handle, language });
    await supabase.from('draft').update({ suggested_reply: suggested }).eq('id', id);
    await appendEvent(draft.account.id, 'draft.updated', { draft_id: id, status: 'pending', redrafted: true });
    res.json({ ok: true, suggested_reply: suggested });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

