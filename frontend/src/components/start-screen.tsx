"use client"

import { Button } from "@/components/ui/button"

interface StartScreenProps {
  onStartSession: () => void
}

export default function StartScreen({ onStartSession }: StartScreenProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('home/background-img.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo/Title */}
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
          CoachDeck
        </h1>
        
        {/* Tagline */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 font-light leading-relaxed drop-shadow-lg">
          Track, review, and improve your team's performance in real time.
        </p>
        
        {/* CTA Button */}
        <Button 
          onClick={onStartSession} 
          className="px-12 py-6 text-lg md:text-xl font-semibold bg-[#a965e2] hover:bg-[#a965e2]/90 text-white border-0 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          style={{
            boxShadow: '0 10px 30px rgba(169, 101, 226, 0.3)'
          }}
        >
          Start New Session
        </Button>
        
        {/* Bottom tagline */}
        <p className="text-white/70 mt-12 text-sm md:text-base font-medium drop-shadow-md">
          Built for coaches who want to be better.
        </p>
      </div>
      
      {/* Subtle animated elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#a965e2] rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#a965e2] rounded-full animate-pulse opacity-40"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-[#a965e2] rounded-full animate-pulse opacity-50"></div>
    </div>
  )
}
