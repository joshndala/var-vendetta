"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StartScreen from "@/components/start-screen"
import PlayerSetupModal from "@/components/player-setup-modal"
import type { Player } from "../../types"
import { createSession, addPlayers } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  const [showSetup, setShowSetup] = useState(false)

  const startSession = () => {
    setShowSetup(true)
  }

  const handleSetupComplete = async (players: Player[], sport: string) => {
    try {
      // Create session in backend (backend will generate unique ID)
      const sessionResponse = await createSession(sport)
      
      if (sessionResponse.success) {
        const sessionId = sessionResponse.sessionId
        
        // Add players to the session
        await addPlayers(sessionId, players)
        
        // Navigate to the session page
        router.push(`/${sessionId}`)
      } else {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session. Please try again.')
    }
  }

  const handleSetupCancel = () => {
    setShowSetup(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <StartScreen onStartSession={startSession} />
      
      {/* Session Setup Modal */}
      <PlayerSetupModal
        isOpen={showSetup}
        onComplete={handleSetupComplete}
        onCancel={handleSetupCancel}
      />
    </main>
  )
}
