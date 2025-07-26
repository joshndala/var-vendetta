"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Info, HelpCircle } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  // Don't show navbar on session pages (URLs with session IDs)
  if (pathname && pathname !== "/" && pathname !== "/about" && pathname !== "/how-to-use") {
    return null
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: Info },
    { href: "/how-to-use", label: "How to Use", icon: HelpCircle },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#a965e2]/20 text-[#a965e2] border border-[#a965e2]/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 