"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import type { Mistake, AIResponse, Player } from "../../../types"
import EventLogger from "@/components/event-logger"
import EventTimeline from "@/components/event-timeline"
import AIAssistant from "@/components/ai-assistant"
import ApiStatus from "@/components/api-status"

import { Button } from "@/components/ui/button"
import { askQuestion, getEvents, getSession } from "@/lib/api"

const AVAILABLE_SPORTS = [
  { name: 'basketball', displayName: 'Basketball' },
  { name: 'football', displayName: 'American Football' },
  { name: 'soccer', displayName: 'Soccer/Football' },
  { name: 'tennis', displayName: 'Tennis' },
  { name: 'esports', displayName: 'E-Sports' },
  { name: 'general', displayName: 'General Sports' }
]

interface SessionPageProps {
  params: Promise<{
    session_id: string
  }>
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string>("")
  
  // Await params in useEffect
  useEffect(() => {
    const getSessionId = async () => {
      const resolvedParams = await params
      setSessionId(resolvedParams.session_id)
    }
    getSessionId()
  }, [params])
  const [sessionStart, setSessionStart] = useState<number>(Date.now())
  const [events, setEvents] = useState<Mistake[]>([])
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [selectedEventType, setSelectedEventType] = useState<string>("")
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Load events from localStorage and backend on mount
  useEffect(() => {
    if (!sessionId) return // Don't run until sessionId is available
    
    const initializeSession = async () => {
      // Load session information from backend
      try {
        const sessionInfo = await getSession(sessionId)
        setSelectedSport(sessionInfo.sport)
        localStorage.setItem(`coachDeck_sport_${sessionId}`, sessionInfo.sport)
      } catch (error) {
        console.error("Error loading session info:", error)
        // Fallback to localStorage if backend fails
        const storedSport = localStorage.getItem(`coachDeck_sport_${sessionId}`)
        if (storedSport) {
          setSelectedSport(storedSport)
        } else {
          // Final fallback to general sport
          setSelectedSport("general")
        }
      }

      // Load players from localStorage
      const storedPlayers = localStorage.getItem(`coachDeck_players_${sessionId}`)
      if (storedPlayers) {
        try {
          const parsedPlayers = JSON.parse(storedPlayers)
          setPlayers(parsedPlayers)
        } catch (error) {
          console.error("Error parsing stored players:", error)
        }
      }

      // Load session start time
      const storedSessionStart = localStorage.getItem(`coachDeck_session_start_${sessionId}`)
      if (storedSessionStart) {
        setSessionStart(parseInt(storedSessionStart))
      }

      // Load responses from localStorage
      const storedResponses = localStorage.getItem(`coachDeck_responses_${sessionId}`)
      if (storedResponses) {
        try {
          setResponses(JSON.parse(storedResponses))
        } catch (error) {
          console.error("Error parsing stored responses:", error)
        }
      }

      // Load events from localStorage first for immediate display
      const storedEvents = localStorage.getItem(`coachDeck_events_${sessionId}`)
      if (storedEvents) {
        try {
          const parsedEvents = JSON.parse(storedEvents)
          setEvents(parsedEvents)
        } catch (error) {
          console.error("Error parsing stored events:", error)
        }
      }
      
      // Then try to load from backend
      try {
        const backendEvents = await getEvents(sessionId)
        if (backendEvents.length > 0) {
          // Transform backend events to match frontend format
          const transformedEvents = backendEvents.map(event => ({
            id: event.id,
            notes: event.text,
            timestamp: new Date(event.timestamp).getTime() - sessionStart,
            player: undefined, // Will be determined by backend
            type: undefined,   // Will be determined by backend
            tags: event.tags
          }))
          
          // Merge with localStorage events, preferring backend data
          const mergedEvents = [...transformedEvents]
          setEvents(mergedEvents)
          
          // Update localStorage with merged data
          localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(mergedEvents))
        }
      } catch (error) {
        console.error("Error loading events from backend:", error)
        // Continue with localStorage events if backend fails
      }
    }
    
    initializeSession()
  }, [sessionId]) // Removed sessionStart from dependencies to prevent infinite loop

  // Auto-refresh events every 5 seconds (optional - you can remove this if you prefer manual refresh only)
  // useEffect(() => {
  //   if (!sessionId) return
  //   
  //   const interval = setInterval(() => {
  //     loadEventsFromBackend()
  //   }, 5000) // Refresh every 5 seconds
  //   
  //   return () => clearInterval(interval)
  // }, [sessionId])

  // Function to load events from backend
  const loadEventsFromBackend = async () => {
    if (!sessionId) return
    
    setIsRefreshing(true)
    try {
      const backendEvents = await getEvents(sessionId)
      if (backendEvents.length > 0) {
        // Transform backend events to match frontend format
        const transformedEvents = backendEvents.map(event => ({
          id: event.id,
          notes: event.text,
          timestamp: new Date(event.timestamp).getTime() - sessionStart,
          player: undefined,
          type: undefined,
          tags: event.tags
        }))
        
        setEvents(transformedEvents)
        localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(transformedEvents))
        console.log(`Loaded ${transformedEvents.length} events from backend`)
      }
    } catch (error) {
      console.error("Error loading events from backend:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(events))
  }, [events, sessionId])

  // Save responses to localStorage whenever they change
  useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`coachDeck_responses_${sessionId}`, JSON.stringify(responses))
  }, [responses, sessionId])

  // Save session start time
  useEffect(() => {
    if (!sessionId) return
    localStorage.setItem(`coachDeck_session_start_${sessionId}`, sessionStart.toString())
  }, [sessionStart, sessionId])

  // Save players to localStorage whenever they change
  useEffect(() => {
    if (!sessionId || players.length === 0) return
    localStorage.setItem(`coachDeck_players_${sessionId}`, JSON.stringify(players))
  }, [players, sessionId])

  // Save sport to localStorage whenever it changes
  useEffect(() => {
    if (!sessionId || !selectedSport) return
    localStorage.setItem(`coachDeck_sport_${sessionId}`, selectedSport)
  }, [selectedSport, sessionId])



  const addEvent = (event: { notes: string; timestamp: number; backendResponse?: any }) => {
    if (!sessionId) {
      console.error("Session ID not available")
      return
    }
    
    if (event.backendResponse) {
      // Simple approach: just refresh from backend after a short delay
      setTimeout(() => {
        loadEventsFromBackend()
      }, 1000)
    } else {
      // Fallback for when backend call fails
      const newEvent: Mistake = {
        id: uuidv4(),
        notes: event.notes,
        timestamp: event.timestamp,
        player: undefined, // Will be determined by backend
        type: undefined,   // Will be determined by backend
      }
      setEvents((prev) => [...prev, newEvent])
    }
  }

  const askAI = async (question: string) => {
    if (!sessionId) {
      console.error("Session ID not available")
      return
    }
    
    setIsLoading(true)
    try {
      const apiResponse = await askQuestion(question);
      
      const newResponse: AIResponse = {
        id: uuidv4(),
        text: apiResponse.answer,
        timestamp: Date.now(),
      }

      setResponses((prev) => [...prev, newResponse])
    } catch (error) {
      console.error("Error asking AI:", error)
      
      const fallbackResponse: AIResponse = {
        id: uuidv4(),
        text: "I couldn't analyze the events due to a technical issue. Please try again later.",
        timestamp: Date.now(),
      }
      
      setResponses((prev) => [...prev, fallbackResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const endSession = () => {
    // Navigate back to home page
    router.push("/")
  }

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    if (selectedPlayer && event.player !== selectedPlayer) return false
    if (selectedEventType && event.type !== selectedEventType) return false
    if (timeFilter !== "all") {
      const eventTime = event.timestamp
      const sessionTime = Date.now() - sessionStart
      if (timeFilter === "first-half" && eventTime > sessionTime / 2) return false
      if (timeFilter === "last-10" && eventTime < sessionTime - 600000) return false
      if (timeFilter === "second-half" && eventTime <= sessionTime / 2) return false
      if (timeFilter === "last-5" && eventTime < sessionTime - 300000) return false
    }
    return true
  })

  // Don't render anything until sessionId is available
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-lg">Loading session...</div>
      </div>
    )
  }

  return (
    <div 
      className="flex flex-col h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23240046" stop-opacity="0.8"/><stop offset="100%" stop-color="%23000000" stop-opacity="0.9"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23a)"/><circle cx="960" cy="540" r="500" fill="%23a965e2" opacity="0.05"/><circle cx="960" cy="540" r="300" fill="%23a965e2" opacity="0.03"/></svg>')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CoachDeck
            </h1>
            <div className="ml-4 px-3 py-1 text-sm text-white/80 bg-white/10 rounded-lg border border-white/20 font-medium">
              Session: {sessionId}
            </div>
            <div className="ml-2 px-3 py-1 text-sm text-[#a965e2] bg-[#a965e2]/10 rounded-lg border border-[#a965e2]/20 font-medium">
              {AVAILABLE_SPORTS.find(s => s.name === selectedSport)?.displayName || 'Basketball'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={loadEventsFromBackend}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Events
                </>
              )}
            </Button>
            <div className="text-white bg-white/10 px-4 py-2 rounded-lg border border-white/20 font-mono text-lg">
              <SessionTimer startTime={sessionStart} />
            </div>
            <Button
              onClick={endSession}
              className="bg-red-600 hover:bg-red-700 text-white border-0 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
            >
              End Session
            </Button>
          </div>
        </div>
      </header>

      {/* Main content - Three panels */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Panel - Event Logger */}
        <div className="w-1/4 bg-white/5 backdrop-blur-sm border-r border-white/20">
          <EventLogger 
            sessionStart={sessionStart}
            sport={selectedSport}
            sessionId={sessionId}
            onEventLogged={addEvent}
          />
        </div>

        {/* Center Panel - Event Timeline */}
        <div className="w-2/4 bg-white/5 backdrop-blur-sm border-r border-white/20">
          <EventTimeline 
            events={filteredEvents}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
            selectedEventType={selectedEventType}
            setSelectedEventType={setSelectedEventType}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            sessionStart={sessionStart}
          />
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="w-1/4 bg-white/5 backdrop-blur-sm">
          <AIAssistant 
            responses={responses} 
            onAskAI={askAI}
            isLoading={isLoading}
            setResponses={setResponses}
            events={events}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 p-3">
        <div className="flex justify-between items-center px-4 text-sm text-white/70">
          <div className="font-medium">CoachDeck v1.0</div>
          <ApiStatus apiUrl={process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"} />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#a965e2] rounded-full animate-pulse"></div>
            <span className="font-medium">Active</span>
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

  return <span className="font-mono">{formatTime(elapsed)}</span>
} 