"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface MonitoringConfig {
  niche: string
  keywords: string[]
  brandVoice: string
  platforms: string[]
  autoReply: {
    positive: boolean
    questions: boolean
  }
  lastScan: string | null
}

interface MonitoringContextType {
  config: MonitoringConfig
  updateConfig: (config: MonitoringConfig) => void
  isActive: boolean
  toggleMonitoring: () => void
  scanForMentions: () => Promise<void>
}

const defaultConfig: MonitoringConfig = {
  niche: "AI Tools & SaaS",
  keywords: ["AI assistant", "automation tool", "productivity software"],
  brandVoice:
    "Friendly, helpful, and professional. We focus on providing value and building relationships rather than being overly promotional.",
  platforms: ["twitter", "linkedin"],
  autoReply: {
    positive: true,
    questions: true,
  },
  lastScan: null,
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined)

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MonitoringConfig>(defaultConfig)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Load saved config
    const savedConfig = localStorage.getItem("monitoring-config")
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }

    const savedActive = localStorage.getItem("monitoring-active")
    if (savedActive) {
      setIsActive(JSON.parse(savedActive))
    }
  }, [])

  const updateConfig = (newConfig: MonitoringConfig) => {
    setConfig(newConfig)
    localStorage.setItem("monitoring-config", JSON.stringify(newConfig))
  }

  const toggleMonitoring = () => {
    const newActive = !isActive
    setIsActive(newActive)
    localStorage.setItem("monitoring-active", JSON.stringify(newActive))

    if (newActive) {
      // Start monitoring simulation
      console.log("[v0] Monitoring started with config:", config)
    } else {
      console.log("[v0] Monitoring stopped")
    }
  }

  const scanForMentions = async () => {
    if (!isActive) return

    console.log("[v0] Scanning for mentions...")

    // Simulate API call to scan social media
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const now = new Date().toLocaleString()
    updateConfig({ ...config, lastScan: now })

    console.log("[v0] Scan completed at:", now)
  }

  // Simulate periodic scanning
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      scanForMentions()
    }, 30000) // Scan every 30 seconds in demo

    return () => clearInterval(interval)
  }, [isActive, config])

  return (
    <MonitoringContext.Provider
      value={{
        config,
        updateConfig,
        isActive,
        toggleMonitoring,
        scanForMentions,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  )
}

export function useMonitoring() {
  const context = useContext(MonitoringContext)
  if (context === undefined) {
    throw new Error("useMonitoring must be used within a MonitoringProvider")
  }
  return context
}
