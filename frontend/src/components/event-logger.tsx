"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Send, Plus } from "lucide-react"
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
        timestamp: Date.now(),
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
    if (!isRecording) {
      // Start recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setIsRecording(true)
        }
        
        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          // Update the notes field with the transcribed text
          setNotes(prev => {
            const currentText = prev || ''
            const newText = currentText + finalTranscript
            return newText + interimTranscript
          })
        }
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
          alert('Speech recognition failed. Please try again.')
        }
        
        recognition.onend = () => {
          setIsRecording(false)
        }
        
        recognition.start()
      } else {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.')
      }
    } else {
      // Stop recording - this will be handled by the recognition.onend event
      setIsRecording(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-5 h-5 text-[#a965e2]" />
          <h2 className="text-lg font-semibold text-white">Log New Event</h2>
        </div>
        <p className="text-sm text-white/70">
          Describe what happened during the session
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Notes Input */}
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-white">Event Description</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what happened (e.g., 'Player 7 made a passing error in the 15th minute')..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none focus:border-[#a965e2] focus:ring-[#a965e2] min-h-[120px]"
            rows={4}
          />
        </div>

        {/* Quick Templates */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Quick Templates</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Passing Error",
              "Goal Scored", 
              "Defensive Mistake",
              "Great Save",
              "Foul Committed",
              "Tactical Change"
            ].map((template) => (
              <button
                key={template}
                onClick={() => setNotes(prev => prev ? `${prev} ${template}` : template)}
                className="p-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 text-white/80 hover:text-white transition-colors"
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-white/20 space-y-3">
        {/* Voice Recording Button */}
        <Button
          onClick={toggleRecording}
          variant="outline"
          className={`w-full flex items-center justify-center gap-2 transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 animate-pulse' 
              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              <span className="flex items-center gap-2">
                Stop Recording
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              </span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Voice Input
            </>
          )}
        </Button>

        {/* Log Event Button */}
        <Button
          onClick={handleLogEvent}
          disabled={!notes.trim() || isLogging}
          className="w-full bg-[#a965e2] hover:bg-[#a965e2]/80 text-white border-0 flex items-center justify-center gap-2"
        >
          {isLogging ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Logging...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Log Event
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 