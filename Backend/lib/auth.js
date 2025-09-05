function requireCron(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/Bearer\s+/i, '').trim();
  if (!process.env.CRON_TOKEN || token !== process.env.CRON_TOKEN) {
    const e = new Error('Unauthorized cron');
    e.statusCode = 401;
    throw e;
  }
}

function getSessionUserId(req) {
  // Placeholder: integrate your session/JWT here. For now, expect X-User-Id header.
  const uid = req.headers['x-user-id'];
  if (!uid) {
    const e = new Error('Unauthenticated');
    e.statusCode = 401;
    throw e;
  }
  return String(uid);
}

module.exports = {
  requireCron,
  getSessionUserId,
};

