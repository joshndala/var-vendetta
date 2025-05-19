"use client"

import { useState, useEffect } from "react"
import StartScreen from "@/components/start-screen"
import MainUI from "@/components/main-ui"
import { v4 as uuidv4 } from "uuid"
import { endSession as endSessionApi } from "@/lib/api"

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStart, setSessionStart] = useState<number | null>(null)

  // Check localStorage on mount to see if we have an active session
  useEffect(() => {
    const storedSessionId = localStorage.getItem("varVendetta_sessionId")
    const storedSessionStart = localStorage.getItem("varVendetta_sessionStart")

    if (storedSessionId && storedSessionStart) {
      setSessionId(storedSessionId)
      setSessionStart(Number.parseInt(storedSessionStart))
    }
  }, [])

  const startSession = () => {
    const newSessionId = uuidv4()
    const startTime = Date.now()

    setSessionId(newSessionId)
    setSessionStart(startTime)

    // Store in localStorage
    localStorage.setItem("varVendetta_sessionId", newSessionId)
    localStorage.setItem("varVendetta_sessionStart", startTime.toString())
  }

  const endSession = async () => {
    if (sessionId) {
      // Call the API to reset the database
      try {
        await endSessionApi(sessionId)
      } catch (error) {
        console.error("Error ending session:", error)
      }
    }
    
    // Clear session data from state
    setSessionId(null)
    setSessionStart(null)

    // Clear session data from localStorage
    localStorage.removeItem("varVendetta_sessionId")
    localStorage.removeItem("varVendetta_sessionStart")

    // Also clear the mistakes and responses
    localStorage.removeItem("varVendetta_mistakes")
    localStorage.removeItem("varVendetta_responses")
  }

  return (
    <main className="min-h-screen bg-background">
      {!sessionId || !sessionStart ? (
        <StartScreen onStartSession={startSession} />
      ) : (
        <MainUI sessionId={sessionId} sessionStart={sessionStart} onEndSession={endSession} />
      )}
    </main>
  )
}
