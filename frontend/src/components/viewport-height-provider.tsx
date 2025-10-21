"use client"

import { useViewportHeight } from '@/lib/use-viewport-height'
import { useEffect } from 'react'

/**
 * Component that handles viewport height calculation for mobile devices
 * This component only renders on the client side and doesn't affect SSR
 */
export default function ViewportHeightProvider({ children }: { children: React.ReactNode }) {
  useViewportHeight()

  return <>{children}</>
}
