"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { AIResponse } from "../../types"
import { MessageSquare, Loader2, Send, Mic, MicOff } from "lucide-react"
import { askQuestion } from "@/lib/api"
import { v4 as uuidv4 } from "uuid"

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

interface ChatPanelProps {
  responses: AIResponse[]
  onAskRef: () => void
  isLoading: boolean
  setResponses: (updater: (prev: AIResponse[]) => AIResponse[]) => void
}

export default function ChatPanel({ responses, onAskRef, isLoading: externalLoading, setResponses }: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [question, setQuestion] = useState("")
  const [internalLoading, setInternalLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [elapsedRecordingTime, setElapsedRecordingTime] = useState(0)
  const [transcribedText, setTranscribedText] = useState("")
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const latestTranscriptRef = useRef("")
  const finalizedTranscriptsRef = useRef<string[]>([])
  
  // Combined loading state
  const isLoading = externalLoading || internalLoading

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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [responses])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  const processVoiceQuestion = async () => {
    // Only use finalized transcripts for processing to avoid duplication
    let fullTranscript = "";
    
    // If we have finalized transcripts, use those
    if (finalizedTranscriptsRef.current.length > 0) {
      fullTranscript = finalizedTranscriptsRef.current.join(' ');
    } 
    // If no finalized transcripts but we have interim transcript, use that
    else if (latestTranscriptRef.current.trim()) {
      fullTranscript = latestTranscriptRef.current.trim();
    }
    
    // Only proceed if we have text to process
    if (fullTranscript) {
      setQuestion(fullTranscript);
      await handleAskQuestion(fullTranscript);
    }
  };
  
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
          // Still attempt to process if we have a transcript
          processVoiceQuestion();
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
          processVoiceQuestion();
          setIsRecording(false);
        }

        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error)
          
          // If we have any transcript, still try to process it
          if (finalizedTranscriptsRef.current.length > 0 || latestTranscriptRef.current.trim()) {
            processVoiceQuestion();
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
  
  const handleAskQuestion = async (voiceText?: string) => {
    // Use provided voice text or the text from the input field
    const questionText = voiceText?.trim() || question.trim();
    
    if (!questionText || isLoading) return
    
    setInternalLoading(true)
    try {
      const response = await askQuestion(questionText)
      
      // Create a new response object with the answer from the API
      const newResponse: AIResponse = {
        id: uuidv4(),
        text: response.answer,
        timestamp: Date.now(),
      }
      
      // Add response to the responses array
      setResponses(prev => [...prev, newResponse])
      
      // Clear the question input
      setQuestion("")
      setTranscribedText("")
    } catch (error) {
      console.error("Error asking question:", error)
      
      // Add a fallback response when the API fails
      const fallbackResponse: AIResponse = {
        id: uuidv4(),
        text: "I couldn't analyze your question due to a technical issue. Please try again later.",
        timestamp: Date.now(),
      }
      
      // Also add the fallback to the responses array
      setResponses(prev => [...prev, fallbackResponse])
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Referee Analysis</h2>
          {isRecording && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
              <span className="text-red-600 font-medium">Recording: {formatTime(elapsedRecordingTime)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isRecording && transcribedText && (
          <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
            <p className="font-medium mb-1">Transcription:</p>
            <p className="text-gray-700">{transcribedText}</p>
          </div>
        )}
      
        {responses.length === 0 && !isRecording ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare size={48} className="mb-2 text-gray-300" />
            <p>No referee analysis yet</p>
            <p className="text-sm mt-1">Type a question or use voice input to ask the referee</p>
          </div>
        ) : (
          responses.map((response) => (
            <div key={response.id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">Referee Analysis</div>
                <div className="text-xs text-gray-500">{formatTimestamp(response.timestamp)}</div>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{response.text}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the referee a question..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskQuestion();
                }
              }}
              disabled={isLoading || isRecording}
            />
            <Button 
              onClick={() => handleAskQuestion()} 
              disabled={isLoading || !question.trim() || isRecording} 
              className="bg-gray-800 hover:bg-gray-900 text-white px-4"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          
          <Button
            onClick={toggleVoiceRecording}
            disabled={isLoading}
            className={`mt-2 w-full py-3 text-white ${
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
                Ask with Voice
              </div>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-1">Ask questions about plays, incidents, or rules interpretations</p>
        </div>
      </div>
    </div>
  )
}
