"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import type { Mistake } from "../../types"

interface MistakeLoggerProps {
  sessionStart: number
  onMistakeLogged: (mistake: Omit<Mistake, "id">) => void
}

export default function MistakeLogger({ sessionStart, onMistakeLogged }: MistakeLoggerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [elapsedRecordingTime, setElapsedRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setElapsedRecordingTime(Math.floor((Date.now() - recordingStartTime) / 1000))
      }, 1000)
    } else {
      setElapsedRecordingTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, recordingStartTime])

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          const audioUrl = URL.createObjectURL(audioBlob)

          // Calculate elapsed time since session start
          const elapsedTime = Date.now() - sessionStart

          onMistakeLogged({
            timestamp: Date.now(),
            elapsedTime,
            audioBlob,
            audioUrl,
          })

          // Stop all tracks on the stream to release the microphone
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        setRecordingStartTime(Date.now())
      } catch (error) {
        console.error("Error accessing microphone:", error)
        alert("Could not access microphone. Please check permissions.")
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Log Player Mistake</h2>
        {isRecording && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-600 font-medium">Recording: {formatTime(elapsedRecordingTime)}</span>
          </div>
        )}
      </div>

      <Button
        onClick={toggleRecording}
        className={`w-full py-6 text-lg ${
          isRecording ? "bg-red-600 hover:bg-red-700" : "bg-gray-800 hover:bg-gray-900"
        }`}
      >
        {isRecording ? (
          <div className="flex items-center">
            <MicOff className="mr-2" />
            Stop Recording
          </div>
        ) : (
          <div className="flex items-center">
            <Mic className="mr-2" />
            Log Mistake
          </div>
        )}
      </Button>

      <p className="mt-4 text-sm text-gray-500">
        {isRecording
          ? "Click again to stop recording and save the mistake"
          : "Click to start recording the player mistake"}
      </p>
    </div>
  )
}
