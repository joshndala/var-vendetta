"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User } from "lucide-react"

interface AIResponse {
  id: string
  text: string
  timestamp: number
}

interface Event {
  id: string
  player?: string
  type?: string
  notes: string
  timestamp: number
}

interface AIAssistantProps {
  responses: AIResponse[]
  onAskAI: (question: string) => void
  isLoading: boolean
  setResponses: (responses: AIResponse[]) => void
  events: Event[]
}

const SUGGESTED_QUESTIONS = [
  "How is Player 8 performing?",
  "What are the most common mistakes?",
  "Which player has the most assists?",
  "How is our defense doing?",
  "What patterns do you see in our play?",
  "Who needs the most improvement?"
]

export default function AIAssistant({
  responses,
  onAskAI,
  isLoading,
  setResponses,
  events
}: AIAssistantProps) {
  const [question, setQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai', content: string, timestamp: number }>>([])

  const handleAskQuestion = () => {
    if (!question.trim() || isLoading) return

    const userMessage = {
      type: 'user' as const,
      content: question,
      timestamp: Date.now()
    }

    setChatHistory(prev => [...prev, userMessage])
    onAskAI(question)
    setQuestion("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  const handleSuggestedQuestion = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion)
  }

  // Combine chat history with AI responses
  const allMessages = [...chatHistory]
  responses.forEach(response => {
    const aiMessage = {
      type: 'ai' as const,
      content: response.text,
      timestamp: response.timestamp
    }
    allMessages.push(aiMessage)
  })

  // Sort by timestamp
  allMessages.sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center space-x-2 mb-2">
          <Bot className="w-5 h-5 text-[#a965e2]" />
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
        </div>
        <p className="text-sm text-white/70">
          Ask questions about the session
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-white/50 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p className="mb-2">Ask me anything about the session</p>
            <p className="text-sm">I can analyze performance, patterns, and provide insights</p>
          </div>
        ) : (
          allMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-[#a965e2] text-white'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'ai' && (
                    <Bot className="w-4 h-4 mt-0.5 text-[#a965e2] flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <User className="w-4 h-4 mt-0.5 text-white/70 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white border border-white/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#a965e2]" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {allMessages.length === 0 && (
        <div className="p-4 border-t border-white/20">
          <p className="text-sm text-white/70 mb-3">Suggested questions:</p>
          <div className="grid grid-cols-1 gap-2">
            {SUGGESTED_QUESTIONS.map((suggestedQuestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(suggestedQuestion)}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-left justify-start text-xs h-auto p-2"
              >
                {suggestedQuestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/20">
        <div className="flex space-x-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the session..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleAskQuestion}
            disabled={!question.trim() || isLoading}
            className="bg-[#a965e2] hover:bg-[#a965e2]/90 text-white px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Session Stats */}
        <div className="mt-3 text-xs text-white/50">
          <p>{events.length} events logged • {responses.length} AI responses</p>
        </div>
      </div>
    </div>
  )
} 