export interface Mistake {
  id: string
  timestamp: number
  elapsedTime: number
  audioBlob: Blob
  audioUrl: string
}

export interface AIResponse {
  id: string
  text: string
  timestamp: number
}
