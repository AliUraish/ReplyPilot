const { supabase } = require('./db');

async function appendEvent(accountId, type, payload) {
  await supabase.from('event_log').insert({ account_id: accountId, type, payload });
}

module.exports = { appendEvent };

