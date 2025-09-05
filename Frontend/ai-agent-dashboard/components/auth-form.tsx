"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useAuth } from "@/hooks/use-auth"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await signIn(provider)
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const socialProviders = [
    { name: "Twitter", icon: "twitter", color: "hover:bg-blue-50 dark:hover:bg-blue-950" },
    { name: "Instagram", icon: "instagram", color: "hover:bg-pink-50 dark:hover:bg-pink-950" },
    { name: "Google", icon: "google", color: "hover:bg-red-50 dark:hover:bg-red-950" },
    { name: "LinkedIn", icon: "linkedin", color: "hover:bg-blue-50 dark:hover:bg-blue-950" },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>Connect your social media accounts to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialProviders.map((provider) => {
          const IconComponent = Icons[provider.icon as keyof typeof Icons]
          return (
            <Button
              key={provider.name}
              variant="outline"
              className={`w-full justify-start gap-3 h-12 ${provider.color}`}
              onClick={() => handleSocialLogin(provider.name.toLowerCase())}
              disabled={isLoading}
            >
              <IconComponent className="h-5 w-5" />
              Continue with {provider.name}
            </Button>
          )
        })}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Secure OAuth Authentication</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  )
}
