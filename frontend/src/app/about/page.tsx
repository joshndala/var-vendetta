"use client"

export default function AboutPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url('home/background-img.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight drop-shadow-2xl">
          About CoachDeck
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-[#a965e2] mb-4">Why I Built This</h2>
            <p className="text-white/90 leading-relaxed">
              As a big football fan and former coach, I know how much happens during a training session 
              or match that you want to remember later. CoachDeck is my attempt to solve that problem. It's 
              a simple tool that captures moments that matter.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-[#a965e2] mb-4">What It Does</h2>
            <p className="text-white/90 leading-relaxed">
              CoachDeck lets you quickly log events, track individual players, and get AI insights 
              during your sessions. It's designed to be fast and simple - no complex setup, just 
              start logging and focus on coaching.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-[#a965e2] mb-4">Key Features</h2>
            <ul className="text-white/90 space-y-2">
              <li>• Quick event logging with timestamps</li>
              <li>• Player-specific notes and tracking</li>
              <li>• AI assistant for insights and suggestions</li>
              <li>• Session timeline for easy review</li>
              <li>• Works on mobile and desktop</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-[#a965e2] mb-4">Built for Real Coaching</h2>
            <p className="text-white/90 leading-relaxed">
              Coaching is fast-paced and you need tools that keep up. That's why I focused on making 
              CoachDeck simple and reliable. There's no fancy features that get in the way, just what you 
              actually need during a session.
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-white/70 text-lg font-medium drop-shadow-md">
            Give it a try and see if it helps your coaching!
          </p>
        </div>
      </div>
    </div>
  )
} 