"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface PostingResult {
  success: boolean
  postId?: string
  error?: string
  platform: string
}

interface PostingContextType {
  postReply: (platform: string, content: string, originalMentionId: string) => Promise<PostingResult>
  schedulePost: (platform: string, content: string, scheduledTime: Date) => Promise<PostingResult>
  getPostingHistory: () => PostingHistoryItem[]
  isPosting: boolean
}

interface PostingHistoryItem {
  id: string
  platform: string
  content: string
  status: "posted" | "failed" | "scheduled"
  timestamp: string
  originalMentionId?: string
  error?: string
}

const PostingContext = createContext<PostingContextType | undefined>(undefined)

export function SocialPostingProvider({ children }: { children: ReactNode }) {
  const [isPosting, setIsPosting] = useState(false)
  const [postingHistory, setPostingHistory] = useState<PostingHistoryItem[]>([])

  const postReply = async (platform: string, content: string, originalMentionId: string): Promise<PostingResult> => {
    setIsPosting(true)

    try {
      // Simulate API call to social media platform
      console.log(`[v0] Posting to ${platform}:`, content)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1

      if (success) {
        const postId = `${platform}_${Date.now()}`
        const historyItem: PostingHistoryItem = {
          id: postId,
          platform,
          content,
          status: "posted",
          timestamp: new Date().toLocaleString(),
          originalMentionId,
        }

        setPostingHistory((prev) => [historyItem, ...prev])

        console.log(`[v0] Successfully posted to ${platform} with ID:`, postId)
        return { success: true, postId, platform }
      } else {
        const error = "Failed to connect to social media API"
        const historyItem: PostingHistoryItem = {
          id: `failed_${Date.now()}`,
          platform,
          content,
          status: "failed",
          timestamp: new Date().toLocaleString(),
          originalMentionId,
          error,
        }

        setPostingHistory((prev) => [historyItem, ...prev])

        console.log(`[v0] Failed to post to ${platform}:`, error)
        return { success: false, error, platform }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.log(`[v0] Error posting to ${platform}:`, errorMessage)
      return { success: false, error: errorMessage, platform }
    } finally {
      setIsPosting(false)
    }
  }

  const schedulePost = async (platform: string, content: string, scheduledTime: Date): Promise<PostingResult> => {
    console.log(`[v0] Scheduling post for ${platform} at ${scheduledTime}:`, content)

    // Simulate scheduling API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const postId = `scheduled_${platform}_${Date.now()}`
    const historyItem: PostingHistoryItem = {
      id: postId,
      platform,
      content,
      status: "scheduled",
      timestamp: scheduledTime.toLocaleString(),
    }

    setPostingHistory((prev) => [historyItem, ...prev])

    return { success: true, postId, platform }
  }

  const getPostingHistory = () => postingHistory

  return (
    <PostingContext.Provider
      value={{
        postReply,
        schedulePost,
        getPostingHistory,
        isPosting,
      }}
    >
      {children}
    </PostingContext.Provider>
  )
}

export function useSocialPosting() {
  const context = useContext(PostingContext)
  if (context === undefined) {
    throw new Error("useSocialPosting must be used within a SocialPostingProvider")
  }
  return context
}
