"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface ApiStatusProps {
  apiUrl: string
}

export default function ApiStatus({ apiUrl }: ApiStatusProps) {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/test`, { timeout: 5000 })
        if (response.status === 200) {
          setStatus("connected")
          setMessage("API connected")
        } else {
          setStatus("error")
          setMessage(`Unexpected status: ${response.status}`)
        }
      } catch (error) {
        setStatus("error")
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            setMessage("Connection timeout")
          } else if (error.response) {
            setMessage(`Error: ${error.response.status}`)
          } else if (error.request) {
            setMessage("No response from server")
          } else {
            setMessage(error.message)
          }
        } else {
          setMessage("Unknown error")
        }
      }
    }

    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [apiUrl])

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`h-2 w-2 rounded-full ${
          status === "loading" ? "bg-yellow-500 animate-pulse" :
          status === "connected" ? "bg-green-500" :
          "bg-red-500"
        }`}
      />
      <span className="text-xs text-muted-foreground">{message}</span>
    </div>
  )
} 