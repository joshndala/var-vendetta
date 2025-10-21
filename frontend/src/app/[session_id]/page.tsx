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
import { askQuestion, getEvents, getSession, endSession as endSessionAPI } from "@/lib/api"
import { Plus, MessageSquare, Clock, X } from "lucide-react"

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
  const [sessionStart, setSessionStart] = useState<number>(Date.now())
  const [events, setEvents] = useState<Mistake[]>([])
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedSport, setSelectedSport] = useState<string>("")
  
  // Mobile-specific state
  const [activeView, setActiveView] = useState<'timeline' | 'ai' | 'logger'>('timeline')
  const [showEventLogger, setShowEventLogger] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  
  // Await params in useEffect
  useEffect(() => {
    const getSessionId = async () => {
      const resolvedParams = await params
      setSessionId(resolvedParams.session_id)
    }
    getSessionId()
  }, [params])
  
  // Set up polling for automatic event updates
  useEffect(() => {
    if (!sessionId) return
    
    // Set up polling interval (10 seconds)
    const pollInterval = setInterval(() => {
      loadEventsFromBackend()
    }, 10000)
    
    return () => clearInterval(pollInterval)
  }, [sessionId])

  // Load events from localStorage and backend on mount
  useEffect(() => {
    if (!sessionId) return // Don't run until sessionId is available
    
    const initializeSession = async () => {
      // Load session information from backend
      try {
        const sessionInfo = await getSession(sessionId)
        setSelectedSport(sessionInfo.sport)
        localStorage.setItem(`coachDeck_sport_${sessionId}`, sessionInfo.sport)
        
        // Set session start time from database
        const startTime = new Date(sessionInfo.start_time).getTime()
        setSessionStart(startTime)
        localStorage.setItem(`coachDeck_session_start_${sessionId}`, startTime.toString())
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
        
        // Fallback to localStorage for session start time
        const storedSessionStart = localStorage.getItem(`coachDeck_session_start_${sessionId}`)
        if (storedSessionStart) {
          setSessionStart(parseInt(storedSessionStart))
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

      // Load responses from localStorage
      const storedResponses = localStorage.getItem(`coachDeck_responses_${sessionId}`)
      if (storedResponses) {
        try {
          setResponses(JSON.parse(storedResponses))
        } catch (error) {
          console.error("Error parsing stored responses:", error)
        }
      }

      // Load events from backend
      await loadEventsFromBackend()
    }

    initializeSession()
  }, [sessionId])

  const loadEventsFromBackend = async () => {
    if (!sessionId) return
    
    try {
      const backendEvents = await getEvents(sessionId)
      
      // Convert backend events to frontend Mistake format
      const convertedEvents: Mistake[] = backendEvents.map(event => ({
        id: event.id,
        timestamp: new Date(event.timestamp).getTime(),
        player: event.players?.[0]?.playerName || event.players?.[0]?.name || (typeof event.players?.[0] === 'string' ? event.players[0] : "Unknown"),
        type: event.eventType,
        notes: event.text,
        tags: event.tags || []
      }))
      
      setEvents(convertedEvents)
      
      // Save to localStorage as backup
      localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(convertedEvents))
    } catch (error) {
      console.error("Error loading events from backend:", error)
      // Fallback to localStorage
      const storedEvents = localStorage.getItem(`coachDeck_events_${sessionId}`)
      if (storedEvents) {
        try {
          setEvents(JSON.parse(storedEvents))
        } catch (error) {
          console.error("Error parsing stored events:", error)
        }
      }
    }
  }

  const addEvent = (event: { notes: string; timestamp: number; backendResponse?: any }) => {
    try {
      const newEvent: Mistake = {
        id: uuidv4(),
        notes: event.notes,
        timestamp: event.timestamp,
        tags: [],
        type: "Other"
      }

      // Add to state
      setEvents(prev => {
        const updated = [newEvent, ...prev]
        // Save to localStorage
        localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(updated))
        return updated
      })

      // Switch to timeline view on mobile after adding event
      setActiveView('timeline')
      setShowEventLogger(false)
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const askAI = async (question: string) => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await askQuestion(question)
      
      const newResponse: AIResponse = {
        id: uuidv4(),
        text: response.answer,
        timestamp: Date.now()
      }

      setResponses(prev => {
        const updated = [newResponse, ...prev]
        localStorage.setItem(`coachDeck_responses_${sessionId}`, JSON.stringify(updated))
        return updated
      })
    } catch (error) {
      console.error('Error asking AI:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const endSession = async () => {
    try {
      // Save final state to localStorage as backup
      localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(events))
      localStorage.setItem(`coachDeck_responses_${sessionId}`, JSON.stringify(responses))
      
      // Call API to end session and clean up database
      const success = await endSessionAPI(sessionId)
      
      if (success) {
        console.log('Session ended successfully')
      } else {
        console.warn('Failed to end session via API, but continuing...')
      }
      
      // Navigate back to start screen
      router.push('/')
    } catch (error) {
      console.error('Error ending session:', error)
      // Still navigate back even if API call fails
      router.push('/')
    }
  }

  // Filter events based on selected players
  const filteredEvents = events.filter(event => {
    try {
      if (selectedPlayers.length === 0) return true
      if (selectedPlayers.length > 0 && event.player && !selectedPlayers.includes(event.player)) return false
      return true
    } catch (error) {
      console.error('Error filtering event:', error)
      return true // Include event if there's an error filtering
    }
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
      className="flex flex-col min-h-screen lg:h-screen relative"
      style={{
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23240046" stop-opacity="0.8"/><stop offset="100%" stop-color="%23000000" stop-opacity="0.9"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23a)"/><circle cx="960" cy="540" r="500" fill="%23a965e2" opacity="0.05"/><circle cx="960" cy="540" r="300" fill="%23a965e2" opacity="0.03"/></svg>')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: 'calc(var(--vh, 1vh) * 100)'
      }}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Mobile Header */}
      <header className="lg:hidden relative z-10 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg">
        <div className="flex justify-between items-center p-4">
          {/* Left side - App name and timer */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              CoachDeck
            </h1>
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-4 h-4" />
              <SessionTimer startTime={sessionStart} />
            </div>
          </div>
          
          {/* Right side - Recording indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/70 hidden sm:block">Recording</span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block relative z-10 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg">
        <div className="flex justify-between items-center p-6">
          {/* Left side - App name, sport, and session info */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CoachDeck
            </h1>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 text-sm text-[#a965e2] bg-[#a965e2]/10 rounded-lg border border-[#a965e2]/20 font-medium">
                {AVAILABLE_SPORTS.find(s => s.name === selectedSport)?.displayName || 'General Sports'}
              </div>
              <div className="px-3 py-1 text-sm text-white/80 bg-white/10 rounded-lg border border-white/20 font-medium">
                Session: {sessionId.slice(0, 8)}...
              </div>
            </div>
          </div>
          
          {/* Center - Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white/80" />
            <div className="text-white bg-white/10 px-4 py-2 rounded-lg border border-white/20 font-mono text-lg">
              <SessionTimer startTime={sessionStart} />
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/70">Recording</span>
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

      {/* Main content - Responsive layout */}
      <div className="flex flex-1 lg:overflow-hidden relative z-10">
        {/* Desktop Layout (hidden on mobile) */}
        <div className="hidden lg:flex w-full">
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
              selectedPlayer={selectedPlayers}
              setSelectedPlayer={setSelectedPlayers}
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

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col w-full">
          {/* Main content area */}
          <div className="flex-1">
            {/* Event Timeline (default view) */}
            {activeView === 'timeline' && (
              <div className="h-full bg-white/5 backdrop-blur-sm">
                <EventTimeline 
                  events={filteredEvents}
                  selectedPlayer={selectedPlayers}
                  setSelectedPlayer={setSelectedPlayers}
                  sessionStart={sessionStart}
                />
              </div>
            )}

            {/* AI Assistant (collapsible) */}
            {activeView === 'ai' && (
              <div className="h-full bg-white/5 backdrop-blur-sm">
                <AIAssistant 
                  responses={responses} 
                  onAskAI={askAI}
                  isLoading={isLoading}
                  setResponses={setResponses}
                  events={events}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden relative z-10 bg-white/10 backdrop-blur-sm border-t border-white/20">
        <div className="flex justify-around items-center p-3">
          {/* New Event Button */}
          <button
            onClick={() => setShowEventLogger(true)}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 bg-[#a965e2] rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs">New Event</span>
          </button>

          {/* Timeline Button */}
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === 'timeline' ? 'text-[#a965e2]' : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-xs">Timeline</span>
          </button>

          {/* AI Chat Button */}
          <button
            onClick={() => setActiveView('ai')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeView === 'ai' ? 'text-[#a965e2]' : 'text-white/80 hover:text-white'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">AI Chat</span>
          </button>

          {/* End Session Button */}
          <button
            onClick={endSession}
            className="flex flex-col items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-6 h-6" />
            <span className="text-xs">End</span>
          </button>
        </div>
      </nav>

      {/* Mobile Event Logger Modal */}
      {showEventLogger && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm border-t border-white/20 rounded-t-2xl">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Log New Event</h3>
                <button
                  onClick={() => setShowEventLogger(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <EventLogger 
                sessionStart={sessionStart}
                sport={selectedSport}
                sessionId={sessionId}
                onEventLogged={addEvent}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Footer */}
      <footer className="hidden lg:block relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 p-3">
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
    try {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error in SessionTimer useEffect:', error)
    }
  }, [startTime])

  const formatTime = (seconds: number) => {
    try {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    } catch (error) {
      console.error('Error formatting time in SessionTimer:', error)
      return "00:00"
    }
  }

  return <span className="font-mono text-sm">{formatTime(elapsed)}</span>
} 