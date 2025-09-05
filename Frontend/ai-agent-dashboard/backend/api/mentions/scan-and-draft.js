const { supabase } = require('../../lib/db');
const { requireCron } = require('../../lib/auth');
const { getMentions } = require('../../lib/x');
const { generateDraft } = require('../../lib/ai');
const { appendEvent } = require('../../lib/events');
const { applyCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    requireCron(req);

    const { data: accounts, error: accErr } = await supabase
      .from('account')
      .select('id, user_id, x_user_id, handle, settings:settings(selected_model, tone, language), tokens:x_tokens(access_token), state:mention_state(last_since_id)')
      .eq('tokens.revoked', false)
      .limit(1000);
    if (accErr) throw accErr;

    let totalMentions = 0;
    let totalDrafts = 0;

    for (const acc of accounts || []) {
      const accountId = acc.id;
      const xUserId = acc.x_user_id;
      const accessToken = acc.tokens?.access_token;
      const sinceId = acc.state?.last_since_id || undefined;
      const tone = acc.settings?.tone || 'friendly, concise';
      const language = acc.settings?.language || 'en';
      const model = acc.settings?.selected_model || process.env.AI_MODEL || 'gpt-5';

      if (!accessToken || !xUserId) continue;

      let mentionsJson;
      try {
        mentionsJson = await getMentions({ accessToken, userId: xUserId, sinceId });
      } catch (e) {
        await appendEvent(accountId, 'system.notice', { level: 'error', message: 'mentions fetch failed', error: String(e) });
        continue;
      }

      const tweets = mentionsJson.data || [];
      const usersById = new Map((mentionsJson.includes?.users || []).map(u => [u.id, u]));
      if (tweets.length === 0) continue;

      totalMentions += tweets.length;

      const newSinceId = tweets[0]?.id || sinceId; // recent first

      for (const t of tweets) {
        const author = usersById.get(t.author_id) || {};
        const tweetId = t.id;

        const { data: existing, error: exErr } = await supabase
          .from('draft')
          .select('id, status')
          .eq('account_id', accountId)
          .eq('tweet_id', tweetId)
          .maybeSingle();
        if (exErr) continue;
        if (existing && existing.status !== 'failed') continue;

        let suggested = '';
        try {
          suggested = await generateDraft({
            model,
            handle: acc.handle,
            tone,
            tweetText: t.text || '',
            authorHandle: author.username || 'user',
            language,
          });
        } catch (e) {
          await supabase.from('draft').upsert({
            account_id: accountId,
            tweet_id: tweetId,
            conversation_id: t.conversation_id,
            author_id: t.author_id,
            author_handle: author.username || null,
            author_name: author.name || null,
            author_avatar: author.profile_image_url || null,
            tweet_text: t.text || '',
            suggested_reply: null,
            status: 'failed',
            model_used: model,
            error: String(e),
          });
          await appendEvent(accountId, 'draft.updated', { tweet_id: tweetId, status: 'failed' });
          continue;
        }

        const { data: ins, error: insErr } = await supabase.from('draft').upsert({
          account_id: accountId,
          tweet_id: tweetId,
          conversation_id: t.conversation_id,
          author_id: t.author_id,
          author_handle: author.username || null,
          author_name: author.name || null,
          author_avatar: author.profile_image_url || null,
          tweet_text: t.text || '',
          suggested_reply: suggested,
          status: 'pending',
          model_used: model,
        }).select('id').maybeSingle();

        if (!insErr) {
          totalDrafts += 1;
          await appendEvent(accountId, 'draft.created', { draft_id: ins?.id, tweet_id: tweetId });
        }
      }

      await supabase.from('mention_state').upsert({ account_id: accountId, last_since_id: newSinceId });
      await appendEvent(accountId, 'scan.summary', { total: tweets.length, last_since_id: newSinceId });
    }

    res.statusCode = 200;
    res.json({ ok: true, totalMentions, totalDrafts });
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

