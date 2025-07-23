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
  const [sessionStart, setSessionStart] = useState<number>(Date.now())
  const [events, setEvents] = useState<Mistake[]>([])
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Await params in useEffect
  useEffect(() => {
    const getSessionId = async () => {
      const resolvedParams = await params
      setSessionId(resolvedParams.session_id)
    }
    getSessionId()
  }, [params])
  
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

      // Load events from backend
      await loadEventsFromBackend()
    }

    initializeSession()
  }, [sessionId]) // Removed sessionStart from dependencies to prevent infinite loop

  // Auto-refresh events every 5 seconds (optional - you can remove this if you prefer manual refresh only)
  // useEffect(() => {
  //   if (!sessionId) return
  //   
  //   const interval = setInterval(() => {
  //     loadEventsFromBackend()
  //   }, 5000)
  //   
  //   return () => clearInterval(interval)
  // }, [sessionId])

  const loadEventsFromBackend = async () => {
    if (!sessionId) return
    
    setIsRefreshing(true)
    try {
      const backendEvents = await getEvents(sessionId)
      
      // Convert backend events to frontend format
      const convertedEvents = backendEvents.map((event: any) => {
        try {
          console.log('Processing event:', event); // Debug log
          
          // Extract player name from players array or use first player if available
          let playerName = "Unknown"
          
          // Handle different event types
          if (event.eventType === 'team') {
            playerName = "Team"
            console.log('Team event detected, setting player to Team'); // Debug log
          } else if (event.eventType === 'opponent') {
            playerName = "Opposition"
          } else if (event.players && event.players.length > 0) {
            // If players is an array of strings, use the first one
            if (typeof event.players[0] === 'string') {
              playerName = event.players[0]
            }
            // If players is an array of objects, use the name property
            else if (event.players[0] && typeof event.players[0] === 'object' && event.players[0].name) {
              playerName = event.players[0].name
            }
          }
          
          console.log('Final player name:', playerName); // Debug log
          
          // Map event type from backend to frontend format
          let eventType = "Other"
          if (event.eventType) {
            // Map backend event types to frontend event types
            const typeMapping: { [key: string]: string } = {
              'goal': 'Goal',
              'assist': 'Assist',
              'pass': 'Pass',
              'shot': 'Shot Off Target',
              'save': 'Save',
              'foul': 'Foul',
              'tackle': 'Tackle',
              'interception': 'Interception',
              'corner': 'Corner',
              'free_kick': 'Free Kick',
              'penalty': 'Penalty',
              'substitution': 'Substitution',
              'injury': 'Injury',
              'tactical_change': 'Tactical Change',
              'formation_change': 'Formation Change',
              'time_out': 'Time Out',
              'team': 'Team Event',
              'opponent': 'Opponent Event',
              'observation': 'Other'
            }
            eventType = typeMapping[event.eventType] || 'Other'
          }
          
          // Ensure timestamp is valid
          let timestamp = Date.now()
          if (event.timestamp) {
            try {
              timestamp = new Date(event.timestamp).getTime()
              if (isNaN(timestamp)) {
                console.warn('Invalid timestamp, using current time:', event.timestamp)
                timestamp = Date.now()
              }
            } catch (error) {
              console.warn('Error parsing timestamp, using current time:', error)
              timestamp = Date.now()
            }
          }
          
          return {
            id: event.id || `event-${Date.now()}-${Math.random()}`,
            player: playerName,
            type: eventType,
            notes: event.text || "",
            timestamp: timestamp,
            tags: event.tags || [],
            backendResponse: event
          }
        } catch (error) {
          console.error('Error processing event:', error, event)
          // Return a fallback event
          return {
            id: `error-event-${Date.now()}-${Math.random()}`,
            player: "Unknown",
            type: "Other",
            notes: event.text || "Error processing event",
            timestamp: Date.now(),
            tags: [],
            backendResponse: event
          }
        }
      })
      
      setEvents(convertedEvents)
      
      // Save to localStorage
      localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(convertedEvents))
    } catch (error) {
      console.error("Error loading events from backend:", error)
      // Fallback to localStorage if backend fails
      const storedEvents = localStorage.getItem(`coachDeck_events_${sessionId}`)
      if (storedEvents) {
        try {
          setEvents(JSON.parse(storedEvents))
        } catch (error) {
          console.error("Error parsing stored events:", error)
        }
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const addEvent = (event: { notes: string; timestamp: number; backendResponse?: any }) => {
    try {
      const newEvent = {
        id: uuidv4(),
        player: "Unknown",
        type: "Other",
        notes: event.notes,
        timestamp: event.timestamp,
        tags: [],
        backendResponse: event.backendResponse
      }
      
      setEvents(prev => {
        try {
          const updatedEvents = [newEvent, ...prev]
          // Save to localStorage with the updated events
          localStorage.setItem(`coachDeck_events_${sessionId}`, JSON.stringify(updatedEvents))
          return updatedEvents
        } catch (error) {
          console.error('Error updating events:', error)
          return prev
        }
      })
      
      // Refresh events from backend after a delay to get the separated events
      setTimeout(() => {
        loadEventsFromBackend()
      }, 2000)
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const askAI = async (question: string) => {
    if (!sessionId) return
    
    setIsLoading(true)
    try {
      const response = await askQuestion(question)
      const newResponse: AIResponse = {
        id: uuidv4(),
        text: response.answer,
        timestamp: Date.now()
      }
      
      setResponses(prev => {
        try {
          const updatedResponses = [newResponse, ...prev]
          // Save to localStorage
          localStorage.setItem(`coachDeck_responses_${sessionId}`, JSON.stringify(updatedResponses))
          return updatedResponses
        } catch (error) {
          console.error('Error updating responses:', error)
          return prev
        }
      })
    } catch (error) {
      console.error("Error asking AI:", error)
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
    try {
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

  return <span className="font-mono">{formatTime(elapsed)}</span>
} 