"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Icons } from "@/components/icons"
import { listDrafts, approveDraft, rejectDraft, redraft, type DraftItem } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

interface Reply {
  id: string
  originalMention: string
  generatedReply: string
  platform: "twitter" | "instagram" | "linkedin"
  status: "pending" | "approved" | "rejected" | "posting" | "posted" | "failed"
  timestamp: string
  error?: string
}

export function ReplyQueue() {
  const { user } = useAuth()
  const userId = user?.id

  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)

  const [rephraseDialogOpen, setRephraseDialogOpen] = useState<string | null>(null)
  const [rephraseInstructions, setRephraseInstructions] = useState("")
  const [isRephrasing, setIsRephrasing] = useState(false)

  const anyPosting = useMemo(() => replies.some((r) => r.status === "posting"), [replies])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const items = await listDrafts({ status: "pending", order: "recent", limit: 50 }, userId)
        if (cancelled) return
        setReplies(items.map(mapDraftToReply))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load drafts:", e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleApprove = async (id: string) => {
    const reply = replies.find((r) => r.id === id)
    if (!reply) return

    setReplies(replies.map((r) => (r.id === id ? { ...r, status: "posting" as const } : r)))

    try {
      await approveDraft(id, userId, reply.generatedReply)
      setReplies(replies.map((r) => (r.id === id ? { ...r, status: "posted" as const, error: undefined } : r)))
    } catch (error) {
      setReplies(
        replies.map((r) => (r.id === id ? { ...r, status: "failed" as const, error: (error as Error)?.message || "Failed to post reply" } : r)),
      )
    }
  }

  const handleReject = (id: string) => {
    ;(async () => {
      try {
        await rejectDraft(id, userId)
        setReplies(replies.map((reply) => (reply.id === id ? { ...reply, status: "rejected" as const } : reply)))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Reject failed:", e)
      }
    })()
  }

  const handleEdit = (id: string, newReply: string) => {
    setReplies(replies.map((reply) => (reply.id === id ? { ...reply, generatedReply: newReply } : reply)))
  }

  const handleRetry = (id: string) => {
    setReplies(
      replies.map((reply) => (reply.id === id ? { ...reply, status: "pending" as const, error: undefined } : reply)),
    )
  }

  const handleRephrase = async (id: string) => {
    if (!rephraseInstructions.trim()) return

    setIsRephrasing(true)

    try {
      const res = await redraft(id, rephraseInstructions, userId)
      const suggested = (res as any)?.suggested_reply || ""
      const reply = replies.find((r) => r.id === id)
      if (reply) {
        const newReply = suggested || reply.generatedReply
        setReplies(replies.map((r) => (r.id === id ? { ...r, generatedReply: newReply } : r)))
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Redraft failed:", e)
    } finally {
      setIsRephrasing(false)
      setRephraseDialogOpen(null)
      setRephraseInstructions("")
    }
  }

  const getPlatformIcon = (platform: string) => {
    const iconMap = {
      twitter: Icons.twitter,
      instagram: Icons.instagram,
      linkedin: Icons.linkedin,
    }
    return iconMap[platform as keyof typeof iconMap] || Icons.message
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      posting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      posted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }
    return colorMap[status as keyof typeof colorMap] || colorMap.pending
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.clock className="h-5 w-5" />
          Reply Queue
          {anyPosting && <Icons.bot className="h-4 w-4 animate-spin text-blue-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading drafts…</div>
        )}
        {replies.map((reply) => {
          const PlatformIcon = getPlatformIcon(reply.platform)
          return (
            <div key={reply.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformIcon className="h-4 w-4" />
                  <span className="text-sm font-medium capitalize">{reply.platform}</span>
                  <Badge className={getStatusColor(reply.status)}>{reply.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Original Mention:</p>
                  <p className="text-sm bg-muted p-2 rounded text-balance">{reply.originalMention}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Generated Reply:</p>
                  <Textarea
                    value={reply.generatedReply}
                    onChange={(e) => handleEdit(reply.id, e.target.value)}
                    className="min-h-[80px] text-sm"
                    disabled={reply.status !== "pending" && reply.status !== "failed"}
                  />
                </div>
              </div>

              {reply.error && (
                <Alert variant="destructive">
                  <Icons.xCircle className="h-4 w-4" />
                  <AlertDescription>{reply.error}</AlertDescription>
                </Alert>
              )}

              {reply.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(reply.id)} className="flex-1" disabled={isPosting}>
                    <Icons.checkCircle className="h-3 w-3 mr-1" />
                    Post Now
                  </Button>
                  <Dialog
                    open={rephraseDialogOpen === reply.id}
                    onOpenChange={(open) => setRephraseDialogOpen(open ? reply.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Icons.bot className="h-3 w-3 mr-1" />
                        Rephrase
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Rephrase Reply</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">What changes would you like?</p>
                          <Textarea
                            placeholder="e.g., Make it shorter, more formal, add enthusiasm, etc."
                            value={rephraseInstructions}
                            onChange={(e) => setRephraseInstructions(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRephrase(reply.id)}
                            disabled={!rephraseInstructions.trim() || isRephrasing}
                            className="flex-1"
                          >
                            {isRephrasing ? (
                              <>
                                <Icons.bot className="h-3 w-3 mr-1 animate-spin" />
                                Rephrasing...
                              </>
                            ) : (
                              <>
                                <Icons.bot className="h-3 w-3 mr-1" />
                                Rephrase
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRephraseDialogOpen(null)
                              setRephraseInstructions("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" onClick={() => handleReject(reply.id)}>
                    <Icons.xCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {reply.status === "posting" && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Icons.bot className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Posting to {reply.platform}...</span>
                </div>
              )}

              {reply.status === "posted" && (
                <div className="flex items-center gap-2 text-green-600">
                  <Icons.checkCircle className="h-4 w-4" />
                  <span className="text-sm">Successfully posted to {reply.platform}</span>
                </div>
              )}

              {reply.status === "failed" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600">
                    <Icons.xCircle className="h-4 w-4" />
                    <span className="text-sm">Failed to post</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleRetry(reply.id)}>
                    <Icons.bot className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              {reply.status === "rejected" && (
                <div className="flex items-center gap-2 text-red-600">
                  <Icons.xCircle className="h-4 w-4" />
                  <span className="text-sm">Reply rejected</span>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function mapDraftToReply(d: DraftItem): Reply {
  return {
    id: String(d.id),
    originalMention: d.tweet_text || "",
    generatedReply: d.suggested_reply || "",
    platform: "twitter",
    status: (d.status as Reply["status"]) || "pending",
    timestamp: d.created_at ? new Date(d.created_at).toLocaleString() : new Date().toLocaleString(),
    error: d.error || undefined,
  }
}
