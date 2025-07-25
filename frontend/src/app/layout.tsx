import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from '@vercel/analytics/react'
import Navbar from "@/components/navbar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CoachDeck",
  description: "AI-powered sports coaching assistant",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Fix for mobile viewport height
              function setVH() {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }
              
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
