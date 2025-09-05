"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Copy, Check, Send } from "lucide-react"
import { useSocialPosting } from "@/hooks/use-social-posting"

export function SimpleReplyGenerator() {
  const [mention, setMention] = useState("")
  const [tone, setTone] = useState("")
  const [length, setLength] = useState("")
  const [platform, setPlatform] = useState("")
  const [generatedReply, setGeneratedReply] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const { postReply, isPosting } = useSocialPosting()

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "casual", label: "Casual" },
    { value: "enthusiastic", label: "Enthusiastic" },
    { value: "helpful", label: "Helpful" },
  ]

  const lengths = [
    { value: "short", label: "Short (1-2 sentences)" },
    { value: "medium", label: "Medium (3-4 sentences)" },
    { value: "long", label: "Long (5+ sentences)" },
  ]

  const platforms = [
    { value: "twitter", label: "Twitter" },
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
  ]

  const generateReply = async () => {
    if (!mention.trim() || !tone || !length) return

    setIsGenerating(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const replies = {
      short: {
        professional: "Thank you for mentioning us! We appreciate your feedback and are here to help.",
        friendly: "Thanks for the shoutout! 😊 Really appreciate it!",
        casual: "Hey, thanks for the mention! Appreciate you!",
        enthusiastic: "Wow, thank you so much! This made our day! 🎉",
        helpful: "Thanks for reaching out! Happy to assist with any questions.",
      },
      medium: {
        professional:
          "Thank you for mentioning us in your post. We truly value your engagement and feedback. Our team is always here to provide support and answer any questions you might have. We look forward to continuing to serve you.",
        friendly:
          "Thanks so much for the mention! 😊 It really means a lot to us when customers share their experiences. We're always here if you need anything, and we hope to keep exceeding your expectations!",
        casual:
          "Hey there! Thanks for the mention - really appreciate it! We love hearing from our community and it's awesome to see you engaging with us. Keep being awesome!",
        enthusiastic:
          "This is absolutely amazing! 🎉 Thank you so much for mentioning us - it totally made our day! We're thrilled to have you as part of our community and can't wait to keep bringing you great experiences!",
        helpful:
          "Thank you for reaching out and mentioning us! We're always happy to help and support our community. If you have any questions or need assistance with anything, please don't hesitate to let us know.",
      },
      long: {
        professional:
          "Thank you very much for taking the time to mention us in your post. We genuinely appreciate your engagement and the opportunity to connect with you. Your feedback and participation in our community are invaluable to us. Our dedicated team is always available to provide comprehensive support and address any questions or concerns you may have. We are committed to delivering exceptional service and continuously improving based on valuable input from customers like yourself. We look forward to maintaining this positive relationship and continuing to serve you with excellence.",
        friendly:
          "Wow, thank you so much for the wonderful mention! 😊 It really warms our hearts to see such positive engagement from our amazing community. We're incredibly grateful for customers like you who take the time to share their experiences and connect with us. Your support means the world to our entire team, and it motivates us to keep doing our best every single day. We're always here if you need anything at all, and we're excited to continue this journey together. Thanks again for being such an awesome part of our community!",
        casual:
          "Hey! Thanks a ton for the mention - seriously appreciate it! It's so cool to see people in our community engaging and sharing their thoughts. We love connecting with everyone and hearing what you all have to say. You guys are what make this whole thing worthwhile, and it's awesome to be part of such a great community. Keep being amazing, and don't hesitate to reach out anytime. We're always around and love chatting with everyone!",
        enthusiastic:
          "OH MY GOODNESS, THANK YOU! 🎉✨ This mention absolutely made our entire week! We are SO incredibly excited and grateful to have you as part of our amazing community! Your engagement and enthusiasm are exactly what make this journey so incredible and rewarding for our whole team! We can't even begin to express how much this means to us - it's supporters like you who inspire us to keep pushing boundaries and creating amazing experiences! We're beyond thrilled to continue this adventure together and can't wait to see what awesome things are coming next! Thank you, thank you, THANK YOU! 🚀💫",
        helpful:
          "Thank you so much for mentioning us and reaching out! We're absolutely delighted to connect with you and appreciate you taking the time to engage with our community. Our team is dedicated to providing comprehensive support and ensuring that every interaction is valuable and helpful. Whether you have questions about our services, need assistance with anything specific, or just want to share feedback, we're here and ready to help in any way we can. We believe in building strong relationships with our community members and are committed to being a reliable resource for you. Please never hesitate to reach out whenever you need support or have suggestions for how we can improve.",
      },
    }

    const reply =
      replies[length as keyof typeof replies]?.[tone as keyof typeof replies.short] || "Thank you for your mention!"
    setGeneratedReply(reply)
    setIsGenerating(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedReply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDirectPost = async () => {
    if (!generatedReply.trim() || !platform) return

    try {
      const result = await postReply(
        platform as "twitter" | "instagram" | "linkedin",
        generatedReply,
        `direct-${Date.now()}`,
      )

      if (result.success) {
        setGeneratedReply("")
        setMention("")
        setTone("")
        setLength("")
        setPlatform("")
      }
    } catch (error) {
      console.error("Failed to post directly:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Reply Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Mention or Message</label>
          <Textarea
            placeholder="Paste the mention or message you want to reply to..."
            value={mention}
            onChange={(e) => setMention(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Length</label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger>
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                {lengths.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateReply}
          disabled={!mention.trim() || !tone || !length || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Reply...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Reply
            </>
          )}
        </Button>

        {generatedReply && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Generated Reply</label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{tone}</Badge>
                <Badge variant="outline">{length}</Badge>
              </div>
            </div>
            <div className="relative">
              <Textarea
                value={generatedReply}
                onChange={(e) => setGeneratedReply(e.target.value)}
                className="min-h-[120px] pr-12"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                className="absolute top-2 right-2 h-8 w-8 p-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDirectPost} disabled={!platform || isPosting} className="flex-1">
                {isPosting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Now
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  console.log("Adding to reply queue:", generatedReply)
                }}
                variant="outline"
                className="flex-1"
              >
                Add to Queue
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
