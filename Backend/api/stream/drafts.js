const { supabase } = require('../../lib/db');
const { getSessionUserId } = require('../../lib/auth');
const { applyCors } = require('../../lib/cors');

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    const userId = await getSessionUserId(req);
    const { accountId } = req.query || {};
    if (!accountId) return res.status(400).json({ ok: false, error: 'Missing accountId' });

    const { data: acc, error: aErr } = await supabase.from('account').select('id, user_id').eq('id', accountId).maybeSingle();
    if (aErr) throw aErr;
    if (!acc || acc.user_id !== userId) return res.status(404).json({ ok: false, error: 'Not found' });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // CORS headers already set by applyCors
    });

    const lastEventId = req.headers['last-event-id'] ? Number(req.headers['last-event-id']) : null;
    let cursor = lastEventId || 0;

    const send = (event) => {
      res.write(`id: ${event.id}\n`);
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
    };

    const sendHeartbeat = () => {
      res.write(`event: heartbeat\n`);
      res.write(`data: {"ts": ${Date.now()} }\n\n`);
    };

    let active = true;
    req.on('close', () => { active = false; });

    // initial backlog
    const { data: back } = await supabase
      .from('event_log')
      .select('*')
      .eq('account_id', accountId)
      .gt('id', cursor)
      .order('id', { ascending: true })
      .limit(100);
    for (const ev of back || []) { send(ev); cursor = ev.id; }

    // polling loop
    while (active) {
      const { data: events } = await supabase
        .from('event_log')
        .select('*')
        .eq('account_id', accountId)
        .gt('id', cursor)
        .order('id', { ascending: true })
        .limit(100);
      if ((events || []).length) {
        for (const ev of events) { send(ev); cursor = ev.id; }
      } else {
        sendHeartbeat();
      }
      await new Promise(r => setTimeout(r, 2500));
    }
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = e.statusCode || 500;
      res.json({ ok: false, error: String(e.message || e) });
    } else {
      try { res.end(); } catch {}
    }
  }
};

