"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { AIResponse } from "../../types"
import { MessageSquare, Loader2 } from "lucide-react"

interface ChatPanelProps {
  responses: AIResponse[]
  onAskRef: () => void
  isLoading: boolean
}

export default function ChatPanel({ responses, onAskRef, isLoading }: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)

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
            <p className="text-sm mt-1">Click "Ask Ref" to get an analysis of the logged player mistakes</p>
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
        <Button onClick={onAskRef} disabled={isLoading} className="w-full py-6 bg-gray-800 hover:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 animate-spin" />
              Consulting VAR...
            </div>
          ) : (
            <div className="flex items-center">
              <MessageSquare className="mr-2" />
              Ask Ref
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
