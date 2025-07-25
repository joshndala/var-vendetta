"use client"

import { Clock, Users, MessageSquare, FileText, Play, Settings } from "lucide-react"

export default function HowToUsePage() {
  const steps = [
    {
      id: 1,
      icon: Play,
      title: "Start a Session",
      description: "Click 'Start New Session' on the home page. Choose your sport and add your players to get started.",
      color: "text-blue-400"
    },
    {
      id: 2,
      icon: Clock,
      title: "Log Events",
      description: "Use the event logger to record important moments, player actions, and coaching notes with timestamps.",
      color: "text-yellow-400"
    },
    {
      id: 3,
      icon: MessageSquare,
      title: "Get AI Insights",
      description: "Ask the AI assistant questions about your session, player performance, or get coaching suggestions.",
      color: "text-purple-400"
    },
    {
      id: 4,
      icon: FileText,
      title: "Review Timeline",
      description: "View all logged events in chronological order. Filter by player, event type, or time period.",
      color: "text-orange-400"
    },
    {
      id: 5,
      icon: Settings,
      title: "End Session",
      description: "End your session when finished. Note: In this version, session data is not saved and will be lost when you close the app.",
      color: "text-red-400"
    }
  ]

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
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-20">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight drop-shadow-2xl">
          How to Use CoachDeck
        </h1>
        
        <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
          Get started with CoachDeck in just a few simple steps. Our intuitive interface makes 
          tracking your coaching sessions effortless.
        </p>
        
        {/* Timeline Steps */}
        <div className="relative mb-16">
          {/* Timeline line - hidden on mobile */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-[#a965e2] via-white/30 to-[#a965e2] h-full rounded-full"></div>
          
          {steps.map((step, index) => {
            const Icon = step.icon
            const isEven = index % 2 === 0
            
            return (
              <div key={`step-${step.id}`} className="relative mb-12">
                {/* Timeline dot - positioned at the center of each step */}
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-1/2 w-6 h-6 bg-[#a965e2] rounded-full border-4 border-white/20 shadow-lg z-10"></div>
                
                {/* Step content */}
                <div className="flex items-center flex-col md:flex-row gap-8">
                  {isEven ? (
                    <>
                      {/* Left side content */}
                      <div className="w-full md:w-1/2 text-center md:text-right md:pr-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                          <div className="flex items-center justify-center md:justify-end gap-3 mb-4">
                            <div className={`p-3 rounded-full bg-white/10 ${step.color} shadow-lg`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-[#a965e2] drop-shadow-lg">{step.id.toString().padStart(2, '0')}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                          <p className="text-white/80 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                      {/* Empty right side */}
                      <div className="hidden md:block w-1/2"></div>
                    </>
                  ) : (
                    <>
                      {/* Empty left side */}
                      <div className="hidden md:block w-1/2"></div>
                      {/* Right side content */}
                      <div className="w-full md:w-1/2 text-center md:text-left md:pl-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                            <div className={`p-3 rounded-full bg-white/10 ${step.color} shadow-lg`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-3xl font-bold text-[#a965e2] drop-shadow-lg">{step.id.toString().padStart(2, '0')}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                          <p className="text-white/80 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-white/70 text-lg font-medium drop-shadow-md">
            Ready to start your first session?
          </p>
        </div>
      </div>
    </div>
  )
} 