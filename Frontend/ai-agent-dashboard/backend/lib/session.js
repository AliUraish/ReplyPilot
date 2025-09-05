const crypto = require('crypto');

const COOKIE_NAME = 'sid';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

function verify(token, secret) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  const expSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expSig))) return null;
  try {
    const obj = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (obj.exp && Date.now() / 1000 > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers['cookie'] || '';
  const out = {};
  header.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push('Path=/');
  parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  parts.push('SameSite=Lax');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res, name) {
  const secure = process.env.NODE_ENV === 'production';
  setCookie(res, name, '', { maxAge: 0, secure });
}

function getSessionUserId(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const payload = verify(token, secret);
  return payload?.uid || null;
}

function setSessionUserId(res, userId) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const payload = { uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const token = sign(payload, secret);
  const secure = process.env.NODE_ENV === 'production';
  setCookie(res, COOKIE_NAME, token, { maxAge: MAX_AGE_SECONDS, secure });
  return true;
}

function clearSession(res) {
  clearCookie(res, COOKIE_NAME);
}

module.exports = { getSessionUserId, setSessionUserId, clearSession };

