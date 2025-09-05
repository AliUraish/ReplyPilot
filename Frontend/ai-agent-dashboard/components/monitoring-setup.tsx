"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { useMonitoring } from "@/hooks/use-monitoring"

export function MonitoringSetup() {
  const { config, updateConfig, isActive, toggleMonitoring } = useMonitoring()
  const [newKeyword, setNewKeyword] = useState("")

  const addKeyword = () => {
    if (newKeyword.trim() && !config.keywords.includes(newKeyword.trim())) {
      updateConfig({
        ...config,
        keywords: [...config.keywords, newKeyword.trim()],
      })
      setNewKeyword("")
    }
  }

  const removeKeyword = (keyword: string) => {
    updateConfig({
      ...config,
      keywords: config.keywords.filter((k) => k !== keyword),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.settings className="h-5 w-5" />
            Monitoring Configuration
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="monitoring-toggle" className="text-sm">
              {isActive ? "Active" : "Inactive"}
            </Label>
            <Switch id="monitoring-toggle" checked={isActive} onCheckedChange={toggleMonitoring} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="niche">Your Niche/Industry</Label>
          <Input
            id="niche"
            value={config.niche}
            onChange={(e) => updateConfig({ ...config, niche: e.target.value })}
            placeholder="e.g., AI tools, SaaS, Marketing"
          />
        </div>

        <div className="space-y-3">
          <Label>Keywords to Monitor</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add keyword or phrase"
            />
            <Button onClick={addKeyword} size="sm">
              <Icons.bell className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1">
                {keyword}
                <button onClick={() => removeKeyword(keyword)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="brand-voice">Brand Voice & Tone</Label>
          <Textarea
            id="brand-voice"
            value={config.brandVoice}
            onChange={(e) => updateConfig({ ...config, brandVoice: e.target.value })}
            placeholder="Describe your brand's personality, tone, and communication style..."
            className="min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platforms to Monitor</Label>
            <div className="space-y-2">
              {["twitter", "instagram", "linkedin"].map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Switch
                    id={platform}
                    checked={config.platforms.includes(platform)}
                    onCheckedChange={(checked) => {
                      const platforms = checked
                        ? [...config.platforms, platform]
                        : config.platforms.filter((p) => p !== platform)
                      updateConfig({ ...config, platforms })
                    }}
                  />
                  <Label htmlFor={platform} className="capitalize">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Auto-Reply Settings</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-positive"
                  checked={config.autoReply.positive}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      ...config,
                      autoReply: { ...config.autoReply, positive: checked },
                    })
                  }
                />
                <Label htmlFor="auto-positive" className="text-sm">
                  Auto-reply to positive mentions
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-questions"
                  checked={config.autoReply.questions}
                  onCheckedChange={(checked) =>
                    updateConfig({
                      ...config,
                      autoReply: { ...config.autoReply, questions: checked },
                    })
                  }
                />
                <Label htmlFor="auto-questions" className="text-sm">
                  Auto-reply to questions
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last scan: {config.lastScan || "Never"}</span>
            <span>
              Status:{" "}
              {isActive ? (
                <span className="text-green-600">Monitoring active</span>
              ) : (
                <span className="text-orange-600">Monitoring paused</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
