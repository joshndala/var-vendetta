"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { AIResponse } from "../../types"
import { MessageSquare, Loader2, Send } from "lucide-react"
import { askQuestion } from "@/lib/api"
import { v4 as uuidv4 } from "uuid"

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
  
  // Combined loading state
  const isLoading = externalLoading || internalLoading

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
  
  const handleAskQuestion = async () => {
    if (!question.trim() || isLoading) return
    
    setInternalLoading(true)
    try {
      const response = await askQuestion(question.trim())
      
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
        <h2 className="text-xl font-semibold">Referee Analysis</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare size={48} className="mb-2 text-gray-300" />
            <p>No referee analysis yet</p>
            <p className="text-sm mt-1">Ask a question below to get an analysis based on logged player mistakes</p>
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
              disabled={isLoading}
            />
            <Button 
              onClick={handleAskQuestion} 
              disabled={isLoading || !question.trim()} 
              className="bg-gray-800 hover:bg-gray-900 text-white px-4"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Ask questions about plays, incidents, or rules interpretations</p>
        </div>
      </div>
    </div>
  )
}
