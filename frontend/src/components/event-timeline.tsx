"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, User, Filter } from "lucide-react"

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
  selectedPlayer: string
  setSelectedPlayer: (player: string) => void
  selectedEventType: string
  setSelectedEventType: (type: string) => void
  timeFilter: string
  setTimeFilter: (filter: string) => void
  sessionStart: number
}

const PLAYERS = [
  "Player 1", "Player 2", "Player 3", "Player 4", "Player 5",
  "Player 6", "Player 7", "Player 8", "Player 9", "Player 10", "Player 11",
  "Team A", "Team B", "Defense", "Offense"
]

const EVENT_TYPES = [
  "Goal", "Assist", "Passing Error", "Interception", "Shot Off Target",
  "Defensive Error", "Foul", "Yellow Card", "Red Card", "Save",
  "Corner", "Free Kick", "Penalty", "Substitution", "Injury",
  "Tactical Change", "Formation Change", "Time Out", "Other"
]

const TIME_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "first-half", label: "First Half" },
  { value: "second-half", label: "Second Half" },
  { value: "last-10", label: "Last 10 Min" },
  { value: "last-5", label: "Last 5 Min" }
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
  error: {
    icon: "❌",
    color: "bg-red-500/20",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Error"
  },
  default: {
    icon: "📝",
    color: "bg-gray-500/20",
    borderColor: "border-gray-500/30",
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/10",
    label: "Event"
  }
}

const getEventCategory = (tags: string[] = [], type?: string): keyof typeof EVENT_CATEGORIES => {
  if (!tags || tags.length === 0) {
    // Fallback to type-based categorization
    if (type) {
      const lowerType = type.toLowerCase()
      if (lowerType.includes('goal')) return 'goal'
      if (lowerType.includes('assist')) return 'assist'
      if (lowerType.includes('pass')) return 'pass'
      if (lowerType.includes('shot')) return 'shot'
      if (lowerType.includes('save')) return 'save'
      if (lowerType.includes('foul')) return 'foul'
      if (lowerType.includes('card')) return 'card'
      if (lowerType.includes('error')) return 'error'
    }
    return 'default'
  }

  // Check tags for category
  const tagString = tags.join(' ').toLowerCase()
  
  if (tagString.includes('goal')) return 'goal'
  if (tagString.includes('assist')) return 'assist'
  if (tagString.includes('pass')) return 'pass'
  if (tagString.includes('shot')) return 'shot'
  if (tagString.includes('save')) return 'save'
  if (tagString.includes('foul')) return 'foul'
  if (tagString.includes('card') || tagString.includes('yellow') || tagString.includes('red')) return 'card'
  if (tagString.includes('error') || tagString.includes('mistake')) return 'error'
  
  return 'default'
}

const getEventIcon = (type: string) => {
  switch (type) {
    case "Goal":
      return "⚽"
    case "Assist":
      return "🎯"
    case "Passing Error":
      return "❌"
    case "Interception":
      return "🔄"
    case "Shot Off Target":
      return "🎯"
    case "Defensive Error":
      return "🛡️"
    case "Foul":
      return "⚠️"
    case "Yellow Card":
      return "🟨"
    case "Red Card":
      return "🟥"
    case "Save":
      return "🧤"
    case "Corner":
      return "🏁"
    case "Free Kick":
      return "🎯"
    case "Penalty":
      return "⚽"
    case "Substitution":
      return "🔄"
    case "Injury":
      return "🏥"
    case "Tactical Change":
      return "📋"
    case "Formation Change":
      return "📐"
    case "Time Out":
      return "⏸️"
    default:
      return "📝"
  }
}

const formatTime = (timestamp: number) => {
  const minutes = Math.floor(timestamp / 60000)
  const seconds = Math.floor((timestamp % 60000) / 1000)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export default function EventTimeline({
  events,
  selectedPlayer,
  setSelectedPlayer,
  selectedEventType,
  setSelectedEventType,
  timeFilter,
  setTimeFilter,
  sessionStart
}: EventTimelineProps) {
  const clearFilters = () => {
    setSelectedPlayer("")
    setSelectedEventType("")
    setTimeFilter("all")
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
        <div className="grid grid-cols-3 gap-2">
          {/* Player Filter */}
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs">
              <User className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All Players" />
            </SelectTrigger>
            <SelectContent className="bg-white/95">
              {PLAYERS.map((player) => (
                <SelectItem key={player} value={player}>
                  {player}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Event Type Filter */}
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent className="bg-white/95">
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs">
              <Clock className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent className="bg-white/95">
              {TIME_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {(selectedPlayer || selectedEventType || timeFilter !== "all") && (
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
          >
            Clear Filters
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
                        {formatTime(event.timestamp)}
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
            })}
          </div>
        )}
      </div>
    </div>
  )
} 