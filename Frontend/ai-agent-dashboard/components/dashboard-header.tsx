"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Icons } from "@/components/icons"

export function DashboardHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icons.bot className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold">AI Agent Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Icons.settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={signOut}>
            <Icons.logout className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
