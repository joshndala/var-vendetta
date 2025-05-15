"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import type { Mistake } from "../../types"
import { logMistake as logMistakeToApi } from "@/lib/api"

// TypeScript definitions for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
}

// Web Speech API constructor types
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

interface MistakeLoggerProps {
  sessionStart: number
  onMistakeLogged: (mistake: Omit<Mistake, "id">) => void
}

export default function MistakeLogger({ sessionStart, onMistakeLogged }: MistakeLoggerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [elapsedRecordingTime, setElapsedRecordingTime] = useState(0)
  const [transcribedText, setTranscribedText] = useState("")
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const latestTranscriptRef = useRef("")
  // Keep track of finalized transcripts
  const finalizedTranscriptsRef = useRef<string[]>([])
  
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

  // Update the ref when state changes
  useEffect(() => {
    latestTranscriptRef.current = transcribedText;
  }, [transcribedText]);

  // Clean up recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition on unmount:", error);
        }
      }
    };
  }, []);

  const logMistake = async () => {
    // Only use finalized transcripts for logging to avoid duplication
    let fullTranscript = "";
    
    // If we have finalized transcripts, use those
    if (finalizedTranscriptsRef.current.length > 0) {
      fullTranscript = finalizedTranscriptsRef.current.join(' ');
    } 
    // If no finalized transcripts but we have interim transcript, use that
    else if (latestTranscriptRef.current.trim()) {
      fullTranscript = latestTranscriptRef.current.trim();
    }
    
    // Always log the mistake if we have any text
    if (fullTranscript) {
      const elapsedTime = Date.now() - sessionStart;
      
      // Create the mistake object
      const mistakeData: Omit<Mistake, "id"> = {
        timestamp: Date.now(),
        elapsedTime,
        transcribedText: fullTranscript,
        audioBlob: new Blob(), // Empty blob to maintain type compatibility
        audioUrl: "", // Empty string to maintain type compatibility
      };
      
      // Log to frontend callback
      onMistakeLogged(mistakeData);
      
      // Also log to backend API
      try {
        const logResponse = await logMistakeToApi({
          ...mistakeData,
          id: "temporary-id" // Will be replaced by the backend
        });
        console.log("Successfully logged to backend:", logResponse);
      } catch (error) {
        console.error("Failed to log to backend API:", error);
        // We continue even if backend logging fails - data is still in frontend
      }
      
      console.log("Mistake logged with transcript:", fullTranscript);
    } else {
      console.log("No transcript to log");
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
          // Still attempt to log the mistake if we have a transcript
          logMistake();
        }
      }
      setIsRecording(false);
    } else {
      // Start recording with speech recognition
      try {
        // Create a SpeechRecognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
          throw new Error("Speech Recognition not supported in this browser")
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognitionRef.current = recognition

        // Initialize the transcription
        setTranscribedText("")
        latestTranscriptRef.current = ""
        finalizedTranscriptsRef.current = []

        // Handle results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ""
          
          // Process all results from the event
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();
            
            if (event.results[i].isFinal) {
              // Only add to finalized transcripts if it's not already included
              if (transcript && !finalizedTranscriptsRef.current.includes(transcript)) {
                finalizedTranscriptsRef.current.push(transcript);
              }
            } else {
              // Only add non-empty transcripts to interim
              if (transcript) {
                interimTranscript += transcript + " ";
              }
            }
          }
          
          // Trim any extra spaces
          interimTranscript = interimTranscript.trim();
          
          // For display purposes, combine finalized transcripts and current interim
          let displayText = "";
          
          if (finalizedTranscriptsRef.current.length > 0) {
            displayText = finalizedTranscriptsRef.current.join(' ');
          }
          
          // Only add interim text if it's not already part of a finalized transcript
          if (interimTranscript && !displayText.includes(interimTranscript)) {
            displayText = displayText ? `${displayText} ${interimTranscript}` : interimTranscript;
          }
          
          // Update the UI and refs
          setTranscribedText(displayText);
          latestTranscriptRef.current = interimTranscript;
        }

        // Handle end of speech recognition
        recognition.onend = () => {
          logMistake();
          setIsRecording(false);
        }

        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error)
          
          // If we have any transcript, still try to log it
          if (finalizedTranscriptsRef.current.length > 0 || latestTranscriptRef.current.trim()) {
            logMistake();
          }
          
          setIsRecording(false)
        }

        // Start speech recognition
        recognition.start()
        setIsRecording(true)
        setRecordingStartTime(Date.now())
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        alert("Could not start speech recognition. Please check browser compatibility and permissions.")
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

      {isRecording && transcribedText && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
          <p className="font-medium mb-1">Transcription:</p>
          <p className="text-gray-700">{transcribedText}</p>
        </div>
      )}

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
          ? "Click again to stop recording and save the transcription"
          : "Click to start recording and transcribing the player mistake"}
      </p>
    </div>
  )
}
