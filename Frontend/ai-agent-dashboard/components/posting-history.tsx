"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useSocialPosting } from "@/hooks/use-social-posting"

export function PostingHistory() {
  const { getPostingHistory } = useSocialPosting()
  const history = getPostingHistory()

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
      posted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    }
    return colorMap[status as keyof typeof colorMap] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "posted":
        return <Icons.checkCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <Icons.xCircle className="h-4 w-4 text-red-600" />
      case "scheduled":
        return <Icons.clock className="h-4 w-4 text-blue-600" />
      default:
        return <Icons.message className="h-4 w-4" />
    }
  }

  const stats = {
    total: history.length,
    posted: history.filter((h) => h.status === "posted").length,
    failed: history.filter((h) => h.status === "failed").length,
    scheduled: history.filter((h) => h.status === "scheduled").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Icons.message className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posted</p>
                <p className="text-2xl font-bold text-green-600">{stats.posted}</p>
              </div>
              <Icons.checkCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <Icons.xCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Icons.clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.clock className="h-5 w-5" />
            Posting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icons.message className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posting history yet</p>
              <p className="text-sm">Your posted replies will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const PlatformIcon = getPlatformIcon(item.platform)
                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlatformIcon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{item.platform}</span>
                        <Badge className={getStatusColor(item.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {item.status}
                          </div>
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    </div>

                    <p className="text-sm text-foreground bg-muted p-3 rounded">{item.content}</p>

                    {item.error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <Icons.xCircle className="h-4 w-4" />
                        <span>Error: {item.error}</span>
                      </div>
                    )}

                    {item.status === "failed" && (
                      <Button size="sm" variant="outline">
                        <Icons.bot className="h-3 w-3 mr-1" />
                        Retry Post
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
