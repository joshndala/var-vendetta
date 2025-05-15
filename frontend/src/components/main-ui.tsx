"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Mistake, AIResponse } from "../../types"
import MistakeLogger from "@/components/mistake-logger"
import MistakeList from "@/components/mistake-list"
import ChatPanel from "@/components/chat-panel"
import ApiStatus from "@/components/api-status"
import { Button } from "@/components/ui/button"
import { askQuestion } from "@/lib/api"

interface MainUIProps {
  sessionId: string
  sessionStart: number
  onEndSession: () => void
}

export default function MainUI({ sessionId, sessionStart, onEndSession }: MainUIProps) {
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Load mistakes from localStorage on mount
  useEffect(() => {
    const storedMistakes = localStorage.getItem("varVendetta_mistakes")
    if (storedMistakes) {
      try {
        // We can't store Blobs in localStorage, so we need to recreate them from the URLs
        const parsedMistakes = JSON.parse(storedMistakes)
        // Note: In a real app, we'd need to handle the Blob recreation from URLs
        // For this demo, we'll just use the parsed data directly
        setMistakes(parsedMistakes)
      } catch (error) {
        console.error("Error parsing stored mistakes:", error)
      }
    }

    const storedResponses = localStorage.getItem("varVendetta_responses")
    if (storedResponses) {
      try {
        setResponses(JSON.parse(storedResponses))
      } catch (error) {
        console.error("Error parsing stored responses:", error)
      }
    }
  }, [])

  // Save mistakes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("varVendetta_mistakes", JSON.stringify(mistakes))
  }, [mistakes])

  // Save responses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("varVendetta_responses", JSON.stringify(responses))
  }, [responses])

  const addMistake = (mistake: Omit<Mistake, "id">) => {
    const newMistake = {
      ...mistake,
      id: uuidv4(),
    }
    setMistakes((prev) => [...prev, newMistake])
  }

  const askRef = async () => {
    setIsLoading(true)
    try {
      // Ask about recent incidents
      const questionText = "What were the most notable player mistakes in the recent minutes?";
      
      // Call our API
      const apiResponse = await askQuestion(questionText);
      
      const newResponse: AIResponse = {
        id: uuidv4(),
        text: apiResponse.answer,
        timestamp: Date.now(),
      }

      setResponses((prev) => [...prev, newResponse])
    } catch (error) {
      console.error("Error asking ref:", error)
      
      // Add a fallback response when the API fails
      const fallbackResponse: AIResponse = {
        id: uuidv4(),
        text: "I couldn't analyze the recent incidents due to a technical issue. Please try again later.",
        timestamp: Date.now(),
      }
      
      setResponses((prev) => [...prev, fallbackResponse])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background scanlines">
      <header className="bg-primary/90 text-white shadow-md border-b border-primary/30 relative">
        {/* Animated referee stripes at the top - moving left to right */}
        <div className="h-1.5 w-full absolute top-0 referee-stripes-scroll-right"></div>
        
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center">
            <h1 
              className="text-2xl font-bold tracking-tighter glow-red"
              data-text="VAR VENDETTA"
            >
              VAR VENDETTA
            </h1>
            <div className="ml-4 px-2 py-1 text-xs bg-background/10 rounded border border-white/20 font-mono">
              ID: {sessionId.substring(0, 8)}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="digital-clock">
              <SessionTimer startTime={sessionStart} />
            </div>
            <Button
              onClick={onEndSession}
              variant="outline"
              className="text-white border-white/30 bg-background/10 hover:bg-red-800 hover:text-white"
              size="sm"
            >
              END SESSION
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden border-t border-border">
        <div className="w-2/3 flex flex-col bg-card overflow-hidden">
          <MistakeLogger sessionStart={sessionStart} onMistakeLogged={addMistake} />

          <div className="flex-1 overflow-auto p-4">
            <MistakeList mistakes={mistakes} />
          </div>
        </div>

        <div className="w-1/3 border-l border-border bg-card/50">
          <ChatPanel responses={responses} onAskRef={askRef} isLoading={isLoading} />
        </div>
      </div>

      <footer className="bg-background p-1 border-t border-primary/20">
        {/* Animated referee stripes at the bottom - moving right to left */}
        <div className="w-full overflow-hidden">
          <div className="h-1.5 w-full referee-stripes-scroll-left"></div>
        </div>
        
        <div className="flex justify-between items-center px-4 py-1 text-xs text-muted-foreground terminal-text">
          <div>VAR.SYS v1.2.4</div>
          <ApiStatus apiUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"} />
          <div className="flex space-x-2 items-center">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
            <span className="flicker">RUNNING</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SessionTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return <span className="terminal-text font-mono">{formatTime(elapsed)}</span>
}
