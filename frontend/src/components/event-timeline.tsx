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
  setSelectedPlayer: React.Dispatch<React.SetStateAction<string[]>>
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
  const eventText = (type || "").toLowerCase()
  const tagText = tags.join(" ").toLowerCase()
  const combinedText = `${eventText} ${tagText}`

  if (combinedText.includes("goal")) return "goal"
  if (combinedText.includes("assist")) return "assist"
  if (combinedText.includes("pass") || combinedText.includes("passing")) return "pass"
  if (combinedText.includes("shot") || combinedText.includes("shoot")) return "shot"
  if (combinedText.includes("save")) return "save"
  if (combinedText.includes("foul")) return "foul"
  if (combinedText.includes("card") || combinedText.includes("yellow") || combinedText.includes("red")) return "card"
  if (combinedText.includes("team")) return "team"
  if (combinedText.includes("opponent") || combinedText.includes("opposition")) return "opponent"
  
  return "other"
}

const getEventIcon = (type: string) => {
  const lowerType = type.toLowerCase()
  
  if (lowerType.includes("goal")) return "⚽"
  if (lowerType.includes("assist")) return "🎯"
  if (lowerType.includes("pass")) return "🔄"
  if (lowerType.includes("shot")) return "🎯"
  if (lowerType.includes("save")) return "🧤"
  if (lowerType.includes("foul")) return "⚠️"
  if (lowerType.includes("card")) return "🟨"
  if (lowerType.includes("corner")) return "🏁"
  if (lowerType.includes("free kick")) return "🎯"
  if (lowerType.includes("penalty")) return "⚽"
  if (lowerType.includes("substitution")) return "🔄"
  if (lowerType.includes("injury")) return "🏥"
  if (lowerType.includes("tactical")) return "📋"
  if (lowerType.includes("formation")) return "📐"
  if (lowerType.includes("time out")) return "⏸️"
  
  return "📝"
}

const formatTime = (timestamp: number, sessionStart: number) => {
  try {
    const elapsed = Math.floor((timestamp - sessionStart) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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
    setSelectedPlayer([])
  }

  const togglePlayer = (player: string) => {
    setSelectedPlayer(prev => 
      prev.includes(player) 
        ? prev.filter(p => p !== player)
        : [...prev, player]
    )
  }

  // Get unique players from events
  const uniquePlayers = Array.from(new Set(events.map(event => event.player).filter((player): player is string => Boolean(player))))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Event Timeline</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/70">Filter</span>
          </div>
        </div>

        {/* Player Filter - Mobile Optimized */}
        <div className="space-y-3">
          {/* Clear Filters Button */}
          {selectedPlayer.length > 0 && (
            <Button
              onClick={clearFilters}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters ({selectedPlayer.length})
            </Button>
          )}

          {/* Player Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {uniquePlayers.map((player) => (
              <button
                key={player}
                onClick={() => togglePlayer(player)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedPlayer.includes(player)
                    ? 'bg-[#a965e2] text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }`}
              >
                <User className="w-3 h-3" />
                {player}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2">No events yet</p>
            <p className="text-sm text-center">
              Start logging events to see them appear here
            </p>
          </div>
        ) : (
          events.map((event) => {
            const category = getEventCategory(event.tags, event.type)
            const categoryConfig = EVENT_CATEGORIES[category]
            const eventIcon = getEventIcon(event.type || "")
            
            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                  categoryConfig.borderColor
                } ${categoryConfig.bgColor} backdrop-blur-sm`}
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                      categoryConfig.color
                    }`}>
                      {eventIcon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {event.player || "Unknown Player"}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          categoryConfig.color
                        } ${categoryConfig.textColor}`}>
                          {event.type || "Event"}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {formatTime(event.timestamp, sessionStart)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Notes */}
                <div className="text-white/90 leading-relaxed">
                  {event.notes}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
} 