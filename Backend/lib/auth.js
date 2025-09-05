const { supabase } = require('./db');
const { getSessionUserId: getUidFromCookie, setSessionUserId } = require('./session');

function requireCron(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/Bearer\s+/i, '').trim();
  if (!process.env.CRON_TOKEN || token !== process.env.CRON_TOKEN) {
    const e = new Error('Unauthorized cron');
    e.statusCode = 401;
    throw e;
  }
}

async function getSessionUserId(req) {
  // Prefer cookie/JWT session if available
  const uid = getUidFromCookie(req);
  if (uid) return String(uid);
  // Fallback to header for development/testing
  const header = req.headers['x-user-id'];
  if (header) return String(header);
  const e = new Error('Unauthenticated');
  e.statusCode = 401;
  throw e;
}

// Ensure a session user exists; if none, create an app_user row and set cookie
async function ensureUserSession(req, res) {
  let uid = getUidFromCookie(req);
  if (uid) return uid;
  // create new app user row
  const { data, error } = await supabase.from('app_user').insert({}).select('id').maybeSingle();
  if (error) {
    const e = new Error('Failed to create user');
    e.statusCode = 500;
    throw e;
  }
  uid = data.id;
  setSessionUserId(res, uid);
  return uid;
}

module.exports = {
  requireCron,
  getSessionUserId,
  ensureUserSession,
};
