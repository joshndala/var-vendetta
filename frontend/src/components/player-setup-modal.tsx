"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, User, Trophy } from "lucide-react"

interface Player {
  id: string
  name: string
  number?: string
}

interface PlayerSetupModalProps {
  isOpen: boolean
  onComplete: (players: Player[], sport: string) => void
  onCancel: () => void
}

const AVAILABLE_SPORTS = [
  { name: 'basketball', displayName: 'Basketball' },
  { name: 'football', displayName: 'American Football' },
  { name: 'soccer', displayName: 'Soccer/Football' },
  { name: 'tennis', displayName: 'Tennis' },
  { name: 'esports', displayName: 'E-Sports' },
  { name: 'general', displayName: 'General Sports' }
]

export default function PlayerSetupModal({ isOpen, onComplete, onCancel }: PlayerSetupModalProps) {
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "", number: "1" },
    { id: "2", name: "", number: "2" }
  ])
  const [selectedSport, setSelectedSport] = useState<string>("basketball")

  const addPlayer = () => {
    const newId = (players.length + 1).toString()
    setPlayers([...players, { id: newId, name: "", number: newId }])
  }

  const removePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(player => player.id !== id))
    }
  }

  const updatePlayer = (id: string, field: 'name' | 'number', value: string) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, [field]: value } : player
    ))
  }

  const handleComplete = () => {
    const validPlayers = players.filter(player => player.name.trim() !== "")
    if (validPlayers.length > 0 && selectedSport) {
      onComplete(validPlayers, selectedSport)
    }
  }

  const canComplete = players.some(player => player.name.trim() !== "") && selectedSport

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-[#a965e2]" />
            <h2 className="text-2xl font-bold text-white">Session Setup</h2>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Sport Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-[#a965e2]" />
            <h3 className="text-lg font-semibold text-white">Select Sport</h3>
          </div>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Choose a sport" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {AVAILABLE_SPORTS.map((sport) => (
                <SelectItem 
                  key={sport.name} 
                  value={sport.name}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  {sport.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-white/60 mt-2">
            This will customize AI analysis and event tagging for your sport.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-[#a965e2]" />
            <h3 className="text-lg font-semibold text-white">Team Players</h3>
          </div>
          <p className="text-white/80 mb-2">
            Add your team players below. You can customize names and numbers.
          </p>
          <p className="text-sm text-white/60">
            At least one player is required to start the session.
          </p>
        </div>

        {/* Players List */}
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-6">
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex-shrink-0 w-8 h-8 bg-[#a965e2] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {player.number || index + 1}
              </div>
              
              <div className="flex-1 space-y-2">
                <Input
                  value={player.name}
                  onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                  placeholder={`Player ${player.number || index + 1} name`}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Input
                  value={player.number || ""}
                  onChange={(e) => updatePlayer(player.id, 'number', e.target.value)}
                  placeholder="Number (optional)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm"
                />
              </div>

              {players.length > 1 && (
                <Button
                  onClick={() => removePlayer(player.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add Player Button */}
        <div className="mb-6">
          <Button
            onClick={addPlayer}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!canComplete}
            className="flex-1 bg-[#a965e2] hover:bg-[#a965e2]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Session
          </Button>
        </div>

        {/* Summary */}
        <div className="text-center text-sm text-white/60">
          <div className="flex justify-center items-center gap-4">
            <span>
              {AVAILABLE_SPORTS.find(s => s.name === selectedSport)?.displayName}
            </span>
            <span>•</span>
            <span>
              {players.filter(p => p.name.trim() !== "").length} player{players.filter(p => p.name.trim() !== "").length !== 1 ? 's' : ''} added
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 