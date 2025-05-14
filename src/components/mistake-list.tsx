"use client"

import { useState } from "react"
import type { Mistake } from "../../types"
import { Play, Pause } from "lucide-react"

interface MistakeListProps {
  mistakes: Mistake[]
}

export default function MistakeList({ mistakes }: MistakeListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useState<HTMLAudioElement | null>(null)

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

  const playAudio = (mistake: Mistake) => {
    if (playingId === mistake.id) {
      // Stop playing
      if (audioRef[0]) {
        audioRef[0].pause()
        audioRef[0] = null
      }
      setPlayingId(null)
    } else {
      // Stop any currently playing audio
      if (audioRef[0]) {
        audioRef[0].pause()
      }

      // Play the new audio
      const audio = new Audio(mistake.audioUrl)
      audio.onended = () => {
        setPlayingId(null)
        audioRef[0] = null
      }
      audio.play()
      audioRef[0] = audio
      setPlayingId(mistake.id)
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
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-medium">Mistake at {formatTimestamp(mistake.timestamp)}</div>
              <div className="text-sm text-gray-500">Session time: {formatElapsedTime(mistake.elapsedTime)}</div>
            </div>

            <button
              onClick={() => playAudio(mistake)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={playingId === mistake.id ? "Pause audio" : "Play audio"}
            >
              {playingId === mistake.id ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
