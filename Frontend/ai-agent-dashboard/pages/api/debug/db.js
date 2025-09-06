const { supabase } = require("../../../backend/lib/db")

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from("app_user").select("id").limit(1)
    if (error) throw error
    res.status(200).json({ ok: true, sampleCount: (data || []).length })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}
