const { supabase } = require('../../../../lib/db');
const { applyCors } = require('../../../../lib/cors');

async function exchangeToken({ clientId, clientSecret, code, redirectUri, codeVerifier }) {
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  body.set('redirect_uri', redirectUri);
  body.set('code_verifier', codeVerifier);
  body.set('client_id', clientId);

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${basic}`;
  }
  const res = await fetch('https://api.twitter.com/2/oauth2/token', { method: 'POST', headers, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`token exchange ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function getMe(accessToken) {
  const res = await fetch('https://api.twitter.com/2/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`users/me ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
}

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const { state, code } = req.query || {};
    if (!state || !code) return res.status(400).json({ ok: false, error: 'Missing state or code' });

    const { data: st } = await supabase.from('oauth_state').select('*').eq('state', String(state)).maybeSingle();
    if (!st) return res.status(400).json({ ok: false, error: 'Invalid state' });

    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET || '';
    const redirectUri = process.env.X_REDIRECT_URI;
    if (!clientId || !redirectUri) return res.status(500).json({ ok: false, error: 'Missing X client env' });

    const token = await exchangeToken({ clientId, clientSecret, code: String(code), redirectUri, codeVerifier: st.code_verifier });
    const accessToken = token.access_token;
    const refreshToken = token.refresh_token || null;
    const expiresIn = token.expires_in || 7200;
    const scopes = (token.scope || '').split(' ');

    const me = await getMe(accessToken);
    const xUserId = me.id;
    const handle = me.username;
    const name = me.name;

    if (st.user_id) {
      await supabase.from('app_user').upsert({ id: st.user_id }).select('id').maybeSingle();
    }

    const { data: acc } = await supabase
      .from('account')
      .upsert({ user_id: st.user_id, x_user_id: xUserId, handle, name }, { onConflict: 'x_user_id' })
      .select('id')
      .maybeSingle();

    const accountId = acc?.id;

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    await supabase.from('x_tokens').upsert({
      account_id: accountId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      scopes,
      revoked: false,
    }, { onConflict: 'account_id' });

    await supabase.from('settings').upsert({ account_id: accountId });
    await supabase.from('mention_state').upsert({ account_id: accountId });
    await supabase.from('oauth_state').delete().eq('state', String(state));

    res.statusCode = 200;
    res.json({ ok: true, account_id: accountId, handle, name });
  } catch (e) {
    res.statusCode = 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};

