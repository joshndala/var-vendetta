"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Filter, X } from "lucide-react"

interface Event {
  id: string
  player?: string
  type?: string
  notes: string
  timestamp: number
  tags?: string[]
}

interface EventTimelineProps {
  events: Event[]
  selectedPlayer: string[]
  setSelectedPlayer: (players: string[]) => void
  sessionStart: number
}

const EVENT_TYPES = [
  "Goal", "Assist", "Passing Error", "Interception", "Shot Off Target",
  "Defensive Error", "Foul", "Yellow Card", "Red Card", "Save",
  "Corner", "Free Kick", "Penalty", "Substitution", "Injury",
  "Tactical Change", "Formation Change", "Time Out", "Other"
]

// Enhanced category system with colors and icons
const EVENT_CATEGORIES = {
  goal: {
    icon: "⚽",
    color: "bg-green-500/20",
    borderColor: "border-green-500/30",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "Goal"
  },
  assist: {
    icon: "🎯",
    color: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "Assist"
  },
  pass: {
    icon: "🔄",
    color: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    label: "Pass"
  },
  shot: {
    icon: "🎯",
    color: "bg-orange-500/20",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    label: "Shot"
  },
  save: {
    icon: "🧤",
    color: "bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    label: "Save"
  },
  foul: {
    icon: "⚠️",
    color: "bg-red-500/20",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Foul"
  },
  card: {
    icon: "🟨",
    color: "bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    label: "Card"
  },
  team: {
    icon: "👥",
    color: "bg-indigo-500/20",
    borderColor: "border-indigo-500/30",
    textColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    label: "Team"
  },
  opponent: {
    icon: "🏆",
    color: "bg-gray-500/20",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/10",
    label: "Opponent"
  },
  other: {
    icon: "📝",
    color: "bg-gray-500/20",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/10",
    label: "Other"
  }
}

const getEventCategory = (tags: string[] = [], type?: string): keyof typeof EVENT_CATEGORIES => {
  try {
    if (!tags || tags.length === 0) {
      // Try to determine category from type
      if (type?.toLowerCase().includes('goal')) return 'goal'
      if (type?.toLowerCase().includes('assist')) return 'assist'
      if (type?.toLowerCase().includes('pass')) return 'pass'
      if (type?.toLowerCase().includes('shot')) return 'shot'
      if (type?.toLowerCase().includes('save')) return 'save'
      if (type?.toLowerCase().includes('foul')) return 'foul'
      if (type?.toLowerCase().includes('card')) return 'card'
      if (type?.toLowerCase().includes('team')) return 'team'
      if (type?.toLowerCase().includes('opponent')) return 'opponent'
      return 'other'
    }

    const tagString = tags.join(' ').toLowerCase()
    
    if (tagString.includes('goal')) return 'goal'
    if (tagString.includes('assist')) return 'assist'
    if (tagString.includes('pass')) return 'pass'
    if (tagString.includes('shot')) return 'shot'
    if (tagString.includes('save')) return 'save'
    if (tagString.includes('foul')) return 'foul'
    if (tagString.includes('card')) return 'card'
    if (tagString.includes('team')) return 'team'
    if (tagString.includes('opponent')) return 'opponent'
    
    return 'other'
  } catch (error) {
    console.error('Error in getEventCategory:', error)
    return 'other'
  }
}

const getEventIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'goal':
      return '⚽'
    case 'assist':
      return '🎯'
    case 'pass':
      return '🔄'
    case 'shot':
      return '🎯'
    case 'save':
      return '🧤'
    case 'foul':
      return '⚠️'
    case 'card':
      return '🟨'
    case 'team':
      return '👥'
    case 'opponent':
      return '🏆'
    default:
      return '📝'
  }
}

const formatTime = (timestamp: number, sessionStart: number) => {
  try {
    // Calculate relative time from session start
    const relativeTime = timestamp - sessionStart
    const minutes = Math.floor(relativeTime / 60000)
    const seconds = Math.floor((relativeTime % 60000) / 1000)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return "00:00"
  }
}

export default function EventTimeline({
  events,
  selectedPlayer,
  setSelectedPlayer,
  sessionStart
}: EventTimelineProps) {
  const clearFilters = () => {
    try {
      setSelectedPlayer([])
    } catch (error) {
      console.error('Error clearing filters:', error)
    }
  }

  // Dynamically generate player list from events
  const uniquePlayers = Array.from(new Set(events.map(event => {
    try {
      return event.player
    } catch (error) {
      console.error('Error getting player from event:', error)
      return null
    }
  }).filter(Boolean))).sort()

  const togglePlayer = (player: string) => {
    try {
      if (selectedPlayer.includes(player)) {
        setSelectedPlayer(selectedPlayer.filter(p => p !== player))
      } else {
        setSelectedPlayer([...selectedPlayer, player])
      }
    } catch (error) {
      console.error('Error toggling player:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Event Timeline</h2>
          <div className="text-sm text-white/70">
            {events.length} events logged
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Player Filter */}
          <div>
            <label className="block text-xs text-white/70 mb-1">Filter by Player/Team</label>
            <div className="flex flex-wrap gap-1">
              {uniquePlayers.map((player) => (
                <button
                  key={player}
                  onClick={() => togglePlayer(player)}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                    selectedPlayer.includes(player)
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
                  }`}
                >
                  {player}
                </button>
              ))}
            </div>
            {selectedPlayer.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-white/70">Selected:</span>
                {selectedPlayer.map((player) => (
                  <span key={player} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/20 text-white border border-white/30">
                    {player}
                    <button
                      onClick={() => togglePlayer(player)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters */}
        {selectedPlayer.length > 0 && (
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
          >
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        {events.length === 0 ? (
          <div className="text-center text-white/50 mt-8">
            <p>No events logged yet</p>
            <p className="text-sm">Start logging events in the left panel</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              try {
                const category = getEventCategory(event.tags, event.type)
                const categoryConfig = EVENT_CATEGORIES[category]
                
                return (
                  <div
                    key={event.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${categoryConfig.bgColor} ${categoryConfig.borderColor} hover:${categoryConfig.color}`}
                  >
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 ${categoryConfig.color} rounded-full border-2 border-white/20`}></div>
                      {index < events.length - 1 && (
                        <div className="w-0.5 h-8 bg-white/20 mt-1"></div>
                      )}
                    </div>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{categoryConfig.icon}</span>
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              {event.player && (
                                <>
                                  <span className="font-semibold text-white">{event.player}</span>
                                  <span className="text-sm text-white/70">•</span>
                                </>
                              )}
                              <span className={`text-sm font-medium ${categoryConfig.textColor}`}>
                                {categoryConfig.label}
                              </span>
                            </div>
                            {event.type && event.type !== categoryConfig.label && (
                              <span className="text-xs text-white/60">{event.type}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-white/50 font-mono bg-black/20 px-2 py-1 rounded">
                          {formatTime(event.timestamp, sessionStart)}
                        </span>
                      </div>
                      
                      {event.notes && (
                        <p className="text-sm text-white/90 mt-2 leading-relaxed">{event.notes}</p>
                      )}
                      
                      {/* Enhanced Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {event.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className={`px-2 py-1 text-xs rounded-full border ${categoryConfig.color} ${categoryConfig.borderColor} ${categoryConfig.textColor} font-medium`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              } catch (error) {
                console.error('Error rendering event:', error, event)
                return (
                  <div key={event.id || `error-${index}`} className="flex items-start space-x-3 p-3 rounded-lg border bg-red-500/10 border-red-500/30">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-red-500/20 rounded-full border-2 border-white/20"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-red-400 font-medium">Error rendering event</div>
                      <div className="text-xs text-white/60 mt-1">{event.notes || 'No description available'}</div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )}
      </div>
    </div>
  )
} 