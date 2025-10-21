"use client"

import { useEffect, useState } from 'react'

/**
 * Hook to handle mobile viewport height calculation without causing hydration issues
 * This hook only runs on the client side and doesn't affect server-side rendering
 */
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const setVH = () => {
      const vh = window.innerHeight * 0.01
      setViewportHeight(vh)
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Set initial value
    setVH()

    // Add event listeners
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  return viewportHeight
}
