module.exports = async (req, res) => {
  try {
    const safe = (v) => (v && String(v).length > 0 ? true : false)
    const isProd = process.env.NODE_ENV === "production"
    const out = {
      NODE_ENV: process.env.NODE_ENV || null,
      X_CLIENT_ID: safe(process.env.X_CLIENT_ID),
      X_REDIRECT_URI: safe(process.env.X_REDIRECT_URI),
      SUPABASE_URL: safe(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: safe(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SESSION_SECRET: safe(process.env.SESSION_SECRET),
      API_KEY_GATEWAY: safe(process.env.API_KEY_GATEWAY),
      AI_MODEL: process.env.AI_MODEL || null,
    }
    // In production, only return booleans; in dev they're already booleans/strings above.
    if (isProd) {
      for (const k of Object.keys(out)) {
        if (k === "AI_MODEL" || k === "NODE_ENV") continue
        out[k] = Boolean(out[k])
      }
    }
    res.status(200).json(out)
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}

