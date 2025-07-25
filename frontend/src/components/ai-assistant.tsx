"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Sparkles } from "lucide-react"

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <Sparkles className="w-12 h-12 mb-4 text-[#a965e2]/50" />
            <p className="text-lg font-medium mb-2">Ready to help!</p>
            <p className="text-sm text-center mb-6">
              Ask me anything about the session or try a suggested question below
            </p>
            
            {/* Suggested Questions */}
            <div className="w-full space-y-2">
              <p className="text-xs text-white/60 mb-3">Suggested questions:</p>
              {SUGGESTED_QUESTIONS.map((suggestedQuestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(suggestedQuestion)}
                  className="w-full p-3 text-left bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-sm text-white/80 hover:text-white"
                >
                  {suggestedQuestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          allMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-[#a965e2] text-white'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'ai' && (
                    <Bot className="w-4 h-4 text-[#a965e2] mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white border border-white/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#a965e2]" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/20">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the session..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#a965e2] focus:ring-[#a965e2]"
            disabled={isLoading}
          />
          <Button
            onClick={handleAskQuestion}
            disabled={!question.trim() || isLoading}
            size="sm"
            className="bg-[#a965e2] hover:bg-[#a965e2]/80 text-white border-0 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        {allMessages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((suggestedQuestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(suggestedQuestion)}
                className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-white/80 hover:text-white transition-colors"
              >
                {suggestedQuestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 