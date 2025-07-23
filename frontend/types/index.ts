export interface Player {
  id: string
  name: string
  number?: string
}

export interface Mistake {
  id: string
  timestamp: number
  elapsedTime?: number
  audioBlob?: Blob
  audioUrl?: string
  transcribedText?: string
  // New event fields
  player?: string
  type?: string
  notes: string
  tags?: string[]
}

export interface AIResponse {
  id: string
  text: string
  timestamp: number
}
