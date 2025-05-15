"use client"

import { Button } from "@/components/ui/button"

interface StartScreenProps {
  onStartSession: () => void
}

export default function StartScreen({ onStartSession }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background scanlines">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded border border-primary/20 shadow-lg relative overflow-hidden">
        {/* Red top edge like a VAR screen */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
        
        <div className="text-center">
          <h1 
            className="text-5xl font-bold text-primary glow-red tracking-tighter mb-2"
            data-text="VAR VENDETTA"
          >
            VAR VENDETTA
          </h1>
          <p className="mt-2 text-muted-foreground terminal-text">Track player mistakes during matches</p>
        </div>

        {/* Animated referee stripes - moving left to right */}
        <div className="bg-muted h-10 flex items-center justify-center rounded overflow-hidden">
          <div className="w-full h-6 referee-stripes-scroll-right"></div>
        </div>

        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs text-accent terminal-text bg-card flicker">SYSTEM READY</span>
          </div>
        </div>

        <Button 
          onClick={onStartSession} 
          className="w-full py-6 text-lg bg-primary hover:bg-primary/90 border border-primary/20 shadow-[0_0_15px_rgba(255,0,0,0.3)]"
        >
          INITIALIZE SESSION
        </Button>

        {/* Bottom referee stripes - moving right to left */}
        <div className="pt-4 opacity-80">
          <div className="flex w-full overflow-hidden">
            <div className="h-1.5 w-full referee-stripes-scroll-left"></div>
          </div>
        </div>
        
        {/* Bottom decorative elements */}
        <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center text-xs terminal-text text-muted-foreground">
          <div>VAR.SYS v1.2.4</div>
          <div className="flex space-x-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
            <div className="h-2 w-2 rounded-full bg-secondary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
