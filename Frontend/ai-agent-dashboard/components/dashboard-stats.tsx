"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export function DashboardStats() {
  const stats = [
    {
      title: "Active Mentions",
      value: "24",
      change: "+12%",
      icon: Icons.bell,
      color: "text-blue-600",
    },
    {
      title: "Replies Generated",
      value: "156",
      change: "+8%",
      icon: Icons.message,
      color: "text-green-600",
    },
    {
      title: "Engagement Rate",
      value: "94.2%",
      change: "+5.1%",
      icon: Icons.trending,
      color: "text-purple-600",
    },
    {
      title: "Connected Platforms",
      value: "4",
      change: "All active",
      icon: Icons.users,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change} from last week</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
