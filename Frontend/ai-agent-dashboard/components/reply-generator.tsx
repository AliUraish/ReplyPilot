"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useMonitoring } from "@/hooks/use-monitoring"

interface ReplyGeneratorProps {
  mention: {
    id: string
    content: string
    author: string
    platform: string
    sentiment: string
  }
  onReplyGenerated: (replies: string[]) => void
  onClose: () => void
}

export function ReplyGenerator({ mention, onReplyGenerated, onClose }: ReplyGeneratorProps) {
  const { config } = useMonitoring()
  const [isGenerating, setIsGenerating] = useState(false)
  const [tone, setTone] = useState("professional")
  const [creativity, setCreativity] = useState([0.7])
  const [includeQuestion, setIncludeQuestion] = useState(true)
  const [generatedReplies, setGeneratedReplies] = useState<string[]>([])

  const toneOptions = [
    { value: "professional", label: "Professional", description: "Formal and business-like" },
    { value: "friendly", label: "Friendly", description: "Warm and approachable" },
    { value: "casual", label: "Casual", description: "Relaxed and conversational" },
    { value: "helpful", label: "Helpful", description: "Solution-focused and supportive" },
    { value: "enthusiastic", label: "Enthusiastic", description: "Energetic and positive" },
  ]

  const generateReplies = async () => {
    setIsGenerating(true)

    // Simulate AI reply generation with different approaches
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const baseContext = {
      brandVoice: config.brandVoice,
      niche: config.niche,
      tone,
      creativity: creativity[0],
      includeQuestion,
      sentiment: mention.sentiment,
      platform: mention.platform,
    }

    // Generate 3 different reply variations
    const replies = [
      generateReplyVariation(mention.content, { ...baseContext, approach: "direct" }),
      generateReplyVariation(mention.content, { ...baseContext, approach: "storytelling" }),
      generateReplyVariation(mention.content, { ...baseContext, approach: "educational" }),
    ]

    setGeneratedReplies(replies)
    setIsGenerating(false)
  }

  const generateReplyVariation = (originalContent: string, context: any) => {
    // Mock AI reply generation based on context
    const templates = {
      direct: {
        positive: "Thank you for the kind words! We're thrilled you're enjoying our AI tools. {question}",
        neutral:
          "Thanks for mentioning us! We'd love to show you how our AI platform can help with {niche}. {question}",
        negative:
          "We appreciate your feedback and take it seriously. Let's connect to discuss how we can improve your experience. {question}",
      },
      storytelling: {
        positive:
          "Stories like yours are exactly why we built this AI platform! It's amazing to see how it's helping people in {niche}. {question}",
        neutral:
          "We've helped many professionals in {niche} streamline their workflows with AI. Would love to share how it could work for you too! {question}",
        negative:
          "We understand your concerns - we've been there too. That's actually what drove us to create a better solution. {question}",
      },
      educational: {
        positive:
          "Great to hear! For others interested in {niche} AI tools, here are the key benefits we focus on: automation, accuracy, and ease of use. {question}",
        neutral:
          "AI in {niche} is evolving rapidly. Our platform focuses on practical applications that deliver real ROI. {question}",
        negative:
          "You raise valid points. The key is finding AI tools that actually solve real problems rather than adding complexity. {question}",
      },
    }

    const questions = {
      professional: "Would you be interested in learning more about our enterprise features?",
      friendly: "What specific challenges are you facing that we might be able to help with?",
      casual: "What's been your biggest pain point lately?",
      helpful: "Is there a particular workflow you'd like to optimize?",
      enthusiastic: "What exciting projects are you working on that could benefit from AI?",
    }

    const template =
      templates[context.approach as keyof typeof templates][context.sentiment as keyof typeof templates.direct]
    const question = context.includeQuestion ? questions[context.tone as keyof typeof questions] : ""

    return template.replace("{niche}", context.niche).replace("{question}", question ? ` ${question}` : "")
  }

  const selectReply = (reply: string) => {
    onReplyGenerated([reply])
    onClose()
  }

  const selectMultiple = () => {
    onReplyGenerated(generatedReplies)
    onClose()
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.bot className="h-5 w-5" />
            AI Reply Generator
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icons.xCircle className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Original Mention */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{mention.platform}</Badge>
            <Badge
              className={
                mention.sentiment === "positive"
                  ? "bg-green-100 text-green-800"
                  : mention.sentiment === "negative"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
              }
            >
              {mention.sentiment}
            </Badge>
          </div>
          <p className="text-sm">
            <strong>@{mention.author}:</strong> {mention.content}
          </p>
        </div>

        {/* Generation Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Reply Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Creativity Level: {creativity[0].toFixed(1)}</Label>
            <Slider value={creativity} onValueChange={setCreativity} max={1} min={0.1} step={0.1} className="w-full" />
          </div>

          <div className="space-y-2">
            <Label>Include Question</Label>
            <Button
              variant={includeQuestion ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeQuestion(!includeQuestion)}
              className="w-full"
            >
              {includeQuestion ? "Yes" : "No"}
            </Button>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generateReplies} disabled={isGenerating} className="w-full" size="lg">
          {isGenerating ? (
            <>
              <Icons.bot className="h-4 w-4 mr-2 animate-spin" />
              Generating AI Replies...
            </>
          ) : (
            <>
              <Icons.bot className="h-4 w-4 mr-2" />
              Generate 3 Reply Options
            </>
          )}
        </Button>

        {/* Generated Replies */}
        {generatedReplies.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Generated Reply Options:</h3>
            {generatedReplies.map((reply, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Option {index + 1}</Badge>
                  <Button size="sm" onClick={() => selectReply(reply)}>
                    Select This Reply
                  </Button>
                </div>
                <Textarea value={reply} readOnly className="min-h-[80px] bg-background" />
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <Button onClick={selectMultiple} variant="outline" className="flex-1 bg-transparent">
                Add All to Queue
              </Button>
              <Button onClick={generateReplies} variant="outline">
                <Icons.bot className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
