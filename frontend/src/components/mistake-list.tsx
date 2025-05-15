"use client"

import { useState } from "react"
import type { Mistake } from "../../types"
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react"

interface MistakeListProps {
  mistakes: Mistake[]
}

export default function MistakeList({ mistakes }: MistakeListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const formatElapsedTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const toggleExpand = (mistakeId: string) => {
    if (expandedId === mistakeId) {
      setExpandedId(null)
    } else {
      setExpandedId(mistakeId)
    }
  }

  if (mistakes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No mistakes logged yet</p>
        <p className="text-sm text-gray-400 mt-2">Use the "Log Mistake" button to record player errors</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Logged Mistakes ({mistakes.length})</h2>

      <div className="space-y-3">
        {mistakes.map((mistake) => (
          <div
            key={mistake.id}
            className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
          >
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleExpand(mistake.id)}
            >
              <div>
                <div className="font-medium">Mistake at {formatTimestamp(mistake.timestamp)}</div>
                <div className="text-sm text-gray-500">Session time: {formatElapsedTime(mistake.elapsedTime)}</div>
              </div>

              <div className="flex items-center">
                {mistake.transcribedText && (
                  <MessageSquare size={18} className="text-gray-400 mr-2" />
                )}
                {expandedId === mistake.id ? (
                  <ChevronUp size={18} className="text-gray-500" />
                ) : (
                  <ChevronDown size={18} className="text-gray-500" />
                )}
              </div>
            </div>

            {expandedId === mistake.id && mistake.transcribedText && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                <div className="p-3 bg-gray-50 rounded text-sm mt-2">
                  <p className="text-gray-700">{mistake.transcribedText}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
