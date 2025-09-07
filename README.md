Backend (Beginner-Friendly Guide)

Welcome! This backend is the quiet helper that:
- Talks to X (Twitter) to read mentions and post replies.
- Uses Supabase as our database and event log.
- Asks an AI model to draft helpful replies.
- Streams live updates to the dashboard.
- Runs a scheduled “scan” (via GitHub Actions cron) to discover new mentions.

Think of it like a small factory:
- A scheduler knocks on the door: “Any new mentions?” (scan-and-draft)
- The factory checks X (Twitter), stores new items (draft replies) in the DB, and logs events.
- The dashboard watches those events and shows updates in real time.
- You approve/reject posts; the backend publishes and logs results.


Folder map
- lib: Building blocks used across the backend (db, sessions, auth, AI, X/Twitter, CORS, events)
- api: HTTP endpoints for mentions, drafts, stream, and auth
- drafts: Draft utilities (e.g., redraft)
- settings: Settings read/update endpoints


How the pieces talk (story version)
1) Cron calls our scan endpoint with a secret token.
2) We fetch mentions from X (Twitter) since last time and ask AI to propose replies.
3) We save them as “drafts” in Supabase and write events into an event_log table.
4) The dashboard opens a live event stream and refreshes when it sees new events.
5) When you approve a draft, we post the reply to X and log another event.


lib/ — shared helpers

1) lib/db.js — Supabase client
Why: we need a single place to talk to the database.

```js
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }, // server-to-server
})

module.exports = { supabase }
```

2) lib/session.js — cookie sessions
Why: we give each browser a simple signed cookie that stores a user id.

```js
const COOKIE_NAME = 'sid'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function sign(payload, secret) {
  // create a base64 payload + HMAC SHA-256 signature
}

function getSessionUserId(req) {
  // read cookie, verify signature, return payload.uid
}

function setSessionUserId(res, userId) {
  // sign { uid, exp } and set cookie
}
```

3) lib/auth.js — auth helpers
Why: enforce who is allowed to do what.

```js
const { supabase } = require('./db')
const { getSessionUserId: getUidFromCookie, setSessionUserId } = require('./session')

function requireCron(req) {
  // Check Authorization: Bearer <CRON_TOKEN>
}

async function getSessionUserId(req) {
  // Prefer cookie sid; fallback to X-User-Id header
}

async function ensureUserSession(req, res) {
  // If no sid, create app_user row and set cookie
}
```

4) lib/x.js — X (Twitter) API calls
Why: a thin wrapper around X v2 endpoints we use.

```js
async function getMentions({ accessToken, userId, sinceId }) {
  // GET https://api.twitter.com/2/users/:id/mentions
}

async function postReply({ accessToken, text, inReplyToTweetId }) {
  // POST https://api.twitter.com/2/tweets with reply object
}
```

5) lib/ai.js — AI drafting
Why: ask an AI model to propose a concise reply.

```js
const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-5'

function buildDraftPrompt({ handle, tone, tweetText, authorHandle, language }) {
  return [
    { role: 'system', content: `You draft concise replies...` },
    { role: 'user', content: `Mention to @${handle} from @${authorHandle}: "${tweetText}"` },
  ]
}

async function chatComplete({ model, messages }) {
  // POST to AI gateway (API_KEY_GATEWAY)
}

async function generateDraft(args) {
  // build prompt -> chatComplete -> sanitize to <=280 chars
}
```

6) lib/events.js — event logger
Why: every important change is appended to event_log so the UI can react.

```js
async function appendEvent(accountId, type, payload) {
  await supabase.from('event_log').insert({ account_id: accountId, type, payload })
}
```

7) lib/cors.js — CORS headers
Why: safe cross-site requests between frontend and backend in dev/prod.

```js
function applyCors(req, res) {
  // Sets Access-Control-Allow-* headers; handles OPTIONS preflight
}
```


api/mentions

mentions/scan-and-draft.js — the “scanner”
Why: periodically fetch new mentions and prepare AI drafts.

What it does:
1) Checks CORS and requires the cron token.
2) Loads connected accounts with valid X tokens.
3) Calls X to fetch mentions since the last id.
4) For each tweet, generates an AI reply and upserts a draft row.
5) Updates mention_state.last_since_id so we don’t re-scan the same tweets.
6) Writes events like draft.created / draft.updated so the UI can refresh.

```js
const { getMentions } = require('../../lib/x')
const { generateDraft } = require('../../lib/ai')
const { appendEvent } = require('../../lib/events')

// inside the handler loop
const mentionsJson = await getMentions({ accessToken, userId: xUserId, sinceId })
// ... build suggested reply ...
await supabase.from('draft').upsert({...})
await appendEvent(accountId, 'draft.created', { draft_id: ins?.id, tweet_id })
```


api/drafts — managing drafts

drafts/list.js — list drafts for the current user
Why: the dashboard needs to show pending/posted/failed/rejected items.

```js
const { getSessionUserId } = require('../../lib/auth')

// 1) find user’s account ids
// 2) select from draft where account_id in (...) and status = ?
// 3) order by created_at or score
```

drafts/get.js — read one draft
Why: open a single draft with ownership check.

drafts/approve.js — post a reply
Why: when you click “Post Now”, this hits X API and updates status.

```js
const { postReply } = require('../../lib/x')

// verify ownership & status
await postReply({ accessToken, text, inReplyToTweetId: draft.tweet_id })
await supabase.from('draft').update({ status: 'posted', posted_at: new Date().toISOString() }).eq('id', id)
await appendEvent(draft.account.id, 'draft.updated', { draft_id: id, status: 'posted' })
```

drafts/reject.js — reject a draft
Why: you don’t want to post it; mark as rejected and emit event.

drafts/approve-bulk.js — post several at once (up to 20)
drafts/reject-bulk.js — reject several (up to 50)


api/stream — live updates (SSE)

stream/drafts.js — Server-Sent Events
Why: push new events to the browser so it can refresh without polling.

What it does:
1) Authenticates the user and verifies the account.
2) Immediately replays any missing events (catch-up).
3) Then, in a loop, queries new rows from event_log and emits them.
4) Sends a heartbeat every ~2.5s to keep the connection alive.

```js
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
})

// For each event row
res.write(`id: ${event.id}\n`)
res.write(`event: ${event.type}\n`)
res.write(`data: ${JSON.stringify(event.payload)}\n\n`)
```


api/auth/x — connect your X (Twitter) account (PKCE OAuth2)

auth/x/login.js — start login
Why: create a PKCE state + code verifier, save it, and redirect to X’s consent screen.

```js
// Create state & code_verifier, save to oauth_state
// 302 redirect to https://twitter.com/i/oauth2/authorize with code_challenge
```

auth/x/callback.js — finish login
Why: exchange code for tokens, fetch the user, and save account + tokens.

```js
// POST /2/oauth2/token with code_verifier -> access_token, refresh_token
// GET /2/users/me -> x_user_id, username
// Upsert account, x_tokens, settings, mention_state; redirect /dashboard
```


drafts/redraft.js — regenerate a draft
Why: when you ask the AI to “Rephrase” with extra instructions (e.g., “more formal”).

```js
const { generateDraft } = require('../lib/ai')

// Fetch draft + settings, combine tone + instructions, call generateDraft
// Update suggested_reply and emit draft.updated
```


settings — account-level settings

settings/get.js — read settings
settings/update.js — upsert tone, language, selected model, etc. and emit settings.updated.


Why we used a GitHub “scanner” (cron)
We need to discover new mentions on a schedule. Instead of running a 24/7 server, we:
- Expose a secure endpoint (requires Authorization: Bearer CRON_TOKEN).
- Use GitHub Actions “schedule” to hit that endpoint every N minutes.

Benefits:
- Simple, serverless-friendly; works with Next.js/Vercel deployments.
- Cheap and reliable: GitHub Actions is great for scheduled jobs.
- Secure by design: only callers with CRON_TOKEN can trigger scans.

Example GitHub Actions workflow

```yaml
name: Scan Mentions
on:
  schedule:
    - cron: '*/5 * * * *' # every 5 minutes
  workflow_dispatch: {}

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Call scan-and-draft endpoint
        run: |
          curl -sS -X POST \
            -H "Authorization: Bearer $CRON_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE/api/scan-and-draft"
        env:
          API_BASE: https://your-deployment-url.example
          CRON_TOKEN: ${{ secrets.CRON_TOKEN }}
```


How the dashboard refreshes
- The backend writes entries to event_log for draft changes and scans.
- The SSE endpoint (/api/stream/drafts) streams those events to the browser.
- The UI can listen for events like draft.created or draft.updated and update its state immediately without a page refresh.


Environment variables (quick reference)
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: DB connection (service role for server-side).
- SESSION_SECRET: signs the session cookie.
- CRON_TOKEN: protects the scan endpoint.
- X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI, X_SCOPES: X (Twitter) OAuth.
- API_KEY_GATEWAY, AI_BASE_URL (optional), AI_MODEL: AI drafting.
- FRONTEND_ORIGIN: CORS allowlist (optional; '*' by default).


Troubleshooting tips
- 401 on scan-and-draft: check CRON_TOKEN header in the request.
- 500 AI error: verify API_KEY_GATEWAY and AI_MODEL; inspect logs.
- No events on the stream: ensure event_log rows are being inserted and the SSE request isn’t blocked by proxies.
- OAuth callback fails: confirm X_CLIENT_ID/X_REDIRECT_URI match your Twitter app settings.

