"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff } from "lucide-react"
import { logTranscript } from "@/lib/api"

interface EventLoggerProps {
  sessionStart: number
  sport: string
  sessionId: string
  onEventLogged: (event: { notes: string; timestamp: number; backendResponse?: any }) => void
}

export default function EventLogger({ 
  sessionStart, 
  sport,
  sessionId,
  onEventLogged 
}: EventLoggerProps) {
  const [notes, setNotes] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLogging, setIsLogging] = useState(false)

  const handleLogEvent = async () => {
    if (!notes.trim()) {
      alert("Please add a description of the event")
      return
    }

    setIsLogging(true)
    
    try {
      // Call backend API to log the event
      const timestamp = new Date(Date.now())
      const logResponse = await logTranscript(notes.trim(), timestamp, sport, sessionId)
      
      console.log("Successfully logged to backend:", logResponse)
      
      // Also call frontend callback for immediate UI update with backend response
      onEventLogged({
        notes: notes.trim(),
        timestamp: Date.now() - sessionStart,
        backendResponse: logResponse
      })

      // Reset form
      setNotes("")
    } catch (error) {
      console.error("Failed to log to backend:", error)
      alert("Failed to log event to backend. Please try again.")
    } finally {
      setIsLogging(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleLogEvent()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: Implement speech recognition
    // When recording starts, it should populate the notes field with transcribed speech
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white mb-1">Event Logger</h2>
        <p className="text-sm text-white/70">Describe events using voice or text</p>
      </div>

      {/* Notes Input */}
      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium text-white">Event Description</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe what happened or use voice input..."
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none h-full"
          rows={6}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2 pt-4">
        <div className="flex gap-2">
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "secondary"}
            className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? "Stop Recording" : "Voice Input"}
          </Button>
          
          <Button
            onClick={handleLogEvent}
            disabled={!notes.trim() || isLogging}
            className="flex-1 bg-[#a965e2] hover:bg-[#a965e2]/90 text-white font-semibold"
          >
            {isLogging ? "Logging..." : "Log Event"}
          </Button>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm font-medium text-center">
              🎤 Recording... Speak clearly to describe the event
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-auto pt-4 border-t border-white/20">
        <div className="text-center text-sm text-white/70">
          <p>Session Active</p>
          <p className="text-xs text-white/50">Ready to log events</p>
        </div>
      </div>
    </div>
  )
} 