const { supabase } = require("../../../backend/lib/db")
const { getSessionUserId } = require("../../../backend/lib/auth")

module.exports = async (req, res) => {
  try {
    const uid = await getSessionUserId(req)

    // Derive connected platforms (current: twitter via x_tokens when not revoked)
    const { data: accs } = await supabase
      .from("account")
      .select("id, user_id, tokens:x_tokens(revoked)")
      .eq("user_id", uid)
      .limit(50)

    const connected = new Set()
    for (const a of accs || []) {
      if (a.tokens && a.tokens.revoked === false) connected.add("twitter")
    }

    res.statusCode = 200
    res.json({
      ok: true,
      user: {
        id: String(uid),
        name: "",
        email: "",
        avatar: "",
        connectedPlatforms: Array.from(connected),
      },
    })
  } catch (e) {
    res.statusCode = e.statusCode || 401
    res.json({ ok: false, error: String(e.message || e) })
  }
}

