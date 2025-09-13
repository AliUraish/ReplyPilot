const { supabase } = require('../../../lib/db');
const { ensureUserSession } = require('../../../lib/auth');
const { applyCors } = require('../../../lib/cors');
const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function genRandomString(bytes = 32) {
  return base64url(crypto.randomBytes(bytes));
}

function sha256Base64Url(str) {
  return base64url(crypto.createHash('sha256').update(str).digest());
}

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const userId = await ensureUserSession(req, res);
    const clientId = process.env.X_CLIENT_ID;
    const redirectUri = process.env.X_REDIRECT_URI;
    const scopes = (process.env.X_SCOPES || 'tweet.read tweet.write users.read offline.access').split(/\s+/).join(' ');

    if (!clientId || !redirectUri) {
      res.statusCode = 500;
      return res.json({ ok: false, error: 'Missing X_CLIENT_ID or X_REDIRECT_URI' });
    }

    const state = genRandomString(24);
    const codeVerifier = genRandomString(48);
    const codeChallenge = sha256Base64Url(codeVerifier);

    await supabase.from('oauth_state').insert({ state, code_verifier: codeVerifier, user_id: userId });

    const authUrl = new URL('https://x.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.statusCode = 302;
    res.setHeader('Location', authUrl.toString());
    res.end();
  } catch (e) {
    res.statusCode = e.statusCode || 500;
    res.json({ ok: false, error: String(e.message || e) });
  }
};
