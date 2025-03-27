"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CreditCard, Dumbbell, Brain, Sparkles, User, LifeBuoy, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navItems = [
  {
    title: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
  },
  {
    title: "My Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    title: "My Workouts",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    title: "My Psychological Plans",
    href: "/psychological-plans",
    icon: Brain,
  },
  {
    title: "My Manifestation Plans",
    href: "/manifestation-plans",
    icon: Sparkles,
  },
  {
    title: "Profile & Settings",
    href: "/profile",
    icon: User,
  },
  {
    title: "Support",
    href: "/support",
    icon: LifeBuoy,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if the current path starts with any of the nav item paths
  const isActive = (href: string) => {
    if (href === "/home" && pathname === "/home") return true
    if (href !== "/home" && pathname.startsWith(href)) return true
    return false
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-background border-b px-4 h-14">
        <div className="flex items-center">
          <span className="font-bold text-xl">STRENTOR</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden",
          isMobileMenuOpen ? "block" : "hidden",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div
        className={cn(
          "fixed top-14 bottom-0 left-0 z-20 w-64 bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0 md:top-0 md:h-screen",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden md:flex items-center h-14 px-6 border-b">
          <span className="font-bold text-xl">STRENTOR</span>
        </div>
        <div className="flex flex-col h-full py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

