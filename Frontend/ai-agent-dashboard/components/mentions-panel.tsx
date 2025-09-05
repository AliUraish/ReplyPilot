"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Icons } from "@/components/icons"
import { ReplyGenerator } from "@/components/reply-generator"

interface Mention {
  id: string
  platform: "twitter" | "instagram" | "linkedin"
  author: string
  avatar: string
  content: string
  timestamp: string
  sentiment: "positive" | "neutral" | "negative"
  status: "new" | "processing" | "replied"
}

export function MentionsPanel() {
  const [mentions] = useState<Mention[]>([
    {
      id: "1",
      platform: "twitter",
      author: "Sarah Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "Just tried the new AI feature and it's amazing! How does it work so well?",
      timestamp: "2 minutes ago",
      sentiment: "positive",
      status: "new",
    },
    {
      id: "2",
      platform: "linkedin",
      author: "Mike Chen",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "Looking for alternatives to current AI tools. Any recommendations?",
      timestamp: "15 minutes ago",
      sentiment: "neutral",
      status: "processing",
    },
    {
      id: "3",
      platform: "instagram",
      author: "Alex Rivera",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "The customer support could be better, but the product is solid.",
      timestamp: "1 hour ago",
      sentiment: "negative",
      status: "replied",
    },
  ])

  const [selectedMention, setSelectedMention] = useState<Mention | null>(null)
  const [showReplyGenerator, setShowReplyGenerator] = useState(false)

  const getPlatformIcon = (platform: string) => {
    const iconMap = {
      twitter: Icons.twitter,
      instagram: Icons.instagram,
      linkedin: Icons.linkedin,
    }
    return iconMap[platform as keyof typeof iconMap] || Icons.message
  }

  const getSentimentColor = (sentiment: string) => {
    const colorMap = {
      positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      neutral: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }
    return colorMap[sentiment as keyof typeof colorMap] || colorMap.neutral
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      new: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      replied: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    }
    return colorMap[status as keyof typeof colorMap] || colorMap.new
  }

  const handleGenerateReply = (mention: Mention) => {
    setSelectedMention(mention)
    setShowReplyGenerator(true)
  }

  const handleReplyGenerated = (replies: string[]) => {
    console.log("[v0] Generated replies for mention:", selectedMention?.id, replies)
    // In a real app, this would add the replies to the reply queue
    setShowReplyGenerator(false)
    setSelectedMention(null)
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.bell className="h-5 w-5" />
            Recent Mentions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mentions.map((mention) => {
            const PlatformIcon = getPlatformIcon(mention.platform)
            return (
              <div key={mention.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={mention.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{mention.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{mention.author}</p>
                      <p className="text-xs text-muted-foreground">{mention.timestamp}</p>
                    </div>
                  </div>
                  <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                </div>

                <p className="text-sm text-foreground">{mention.content}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className={getSentimentColor(mention.sentiment)}>
                      {mention.sentiment}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(mention.status)}>
                      {mention.status}
                    </Badge>
                  </div>
                  {mention.status === "new" && (
                    <Button size="sm" variant="outline" onClick={() => handleGenerateReply(mention)}>
                      <Icons.bot className="h-3 w-3 mr-1" />
                      Generate Reply
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={showReplyGenerator} onOpenChange={setShowReplyGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedMention && (
            <ReplyGenerator
              mention={selectedMention}
              onReplyGenerated={handleReplyGenerated}
              onClose={() => setShowReplyGenerator(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
