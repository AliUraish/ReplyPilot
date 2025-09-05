"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"

export function AIInsights() {
  const insights = {
    sentimentBreakdown: {
      positive: 65,
      neutral: 25,
      negative: 10,
    },
    topKeywords: [
      { keyword: "AI assistant", mentions: 12, trend: "up" },
      { keyword: "automation", mentions: 8, trend: "up" },
      { keyword: "productivity", mentions: 6, trend: "stable" },
      { keyword: "workflow", mentions: 4, trend: "down" },
    ],
    responseRate: 94.2,
    avgResponseTime: "2.3 minutes",
    engagementScore: 87,
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <Icons.trending className="h-3 w-3 text-green-600" />
      case "down":
        return <Icons.trending className="h-3 w-3 text-red-600 rotate-180" />
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.trending className="h-5 w-5" />
            Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Positive</span>
              <span className="text-sm text-muted-foreground">{insights.sentimentBreakdown.positive}%</span>
            </div>
            <Progress value={insights.sentimentBreakdown.positive} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Neutral</span>
              <span className="text-sm text-muted-foreground">{insights.sentimentBreakdown.neutral}%</span>
            </div>
            <Progress value={insights.sentimentBreakdown.neutral} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Negative</span>
              <span className="text-sm text-muted-foreground">{insights.sentimentBreakdown.negative}%</span>
            </div>
            <Progress value={insights.sentimentBreakdown.negative} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.eye className="h-5 w-5" />
            Trending Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.topKeywords.map((item) => (
              <div key={item.keyword} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.keyword}</Badge>
                  {getTrendIcon(item.trend)}
                </div>
                <span className="text-sm text-muted-foreground">{item.mentions} mentions</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.bot className="h-5 w-5" />
            AI Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Response Rate</span>
            <span className="text-lg font-bold text-green-600">{insights.responseRate}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Avg Response Time</span>
            <span className="text-lg font-bold">{insights.avgResponseTime}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Engagement Score</span>
              <span className="text-sm text-muted-foreground">{insights.engagementScore}/100</span>
            </div>
            <Progress value={insights.engagementScore} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
