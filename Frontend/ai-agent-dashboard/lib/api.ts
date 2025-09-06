export type DraftStatus = "pending" | "posted" | "failed" | "rejected" | string

export interface DraftItem {
  id: string
  account_id: string
  tweet_id: string
  tweet_text: string
  suggested_reply: string | null
  status: DraftStatus
  created_at?: string
  author_handle?: string | null
  error?: string | null
}

type ListOptions = {
  status?: string
  limit?: number
  order?: "recent" | "score"
  accountId?: string
}

function authHeaders(userId?: string) {
  const headers: Record<string, string> = {}
  if (userId) headers["X-User-Id"] = String(userId)
  return headers
}

async function apiFetch<T>(path: string, opts: RequestInit = {}, userId?: string): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Accept": "application/json",
      ...(opts.headers || {}),
      ...authHeaders(userId),
    },
    credentials: "include",
  })
  const ct = res.headers.get("content-type") || ""
  const body = ct.includes("application/json") ? await res.json() : await res.text()
  if (!res.ok) {
    const msg = typeof body === "string" ? body : body?.error || JSON.stringify(body)
    throw new Error(msg || `Request failed: ${res.status}`)
  }
  return body as T
}

export async function listDrafts(opts: ListOptions = {}, userId?: string): Promise<DraftItem[]> {
  const params = new URLSearchParams()
  if (opts.status) params.set("status", opts.status)
  if (opts.limit) params.set("limit", String(opts.limit))
  if (opts.order) params.set("order", opts.order)
  if (opts.accountId) params.set("accountId", opts.accountId)
  const url = `/api/drafts?action=list${params.toString() ? `&${params.toString()}` : ""}`
  const data = await apiFetch<{ items: DraftItem[]; nextCursor: string | null }>(url, { method: "GET" }, userId)
  return data.items || []
}

export async function getDraft(id: string, userId?: string): Promise<DraftItem> {
  const url = `/api/drafts?action=get&id=${encodeURIComponent(id)}`
  const data = await apiFetch<{ draft: DraftItem }>(url, { method: "GET" }, userId)
  return data.draft
}

export async function approveDraft(id: string, userId?: string, replyOverride?: string): Promise<{ ok: boolean }> {
  const url = `/api/drafts?action=approve&id=${encodeURIComponent(id)}`
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(replyOverride ? { reply_override: replyOverride } : {}),
  }, userId)
}

export async function rejectDraft(id: string, userId?: string): Promise<{ ok: boolean }> {
  const url = `/api/drafts?action=reject&id=${encodeURIComponent(id)}`
  return apiFetch(url, { method: "POST" }, userId)
}

export async function redraft(id: string, instructions: string, userId?: string): Promise<{ ok: boolean; suggested_reply?: string }>{
  const url = `/api/drafts?action=redraft&id=${encodeURIComponent(id)}`
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions }),
  }, userId)
}

