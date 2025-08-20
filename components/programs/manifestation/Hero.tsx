"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sparkles, Brain, Zap } from "lucide-react" // Zap for energy, or another suitable icon

const features = [
  {
    text: "Energy Alignment Coaching",
    icon: Zap, // Or another icon like Wind or Waves if Zap feels too aggressive
    color: "#FFBD22" // Main Manifestation Accent
  },
  {
    text: "Mindset Mastery",
    icon: Brain,
    color: "#FFA726" // A slightly different shade of yellow/orange
  },
  {
    text: "Goal Manifestation",
    icon: Sparkles,
    color: "#FF8F00" // Another shade for variety
  }
]

export default function ManifestationHero() {
  return (
    <div className="relative">
      {/* Main Hero Container */}
      <div className="relative min-h-[90vh] bg-black">
        <Image
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Example image, replace if a better one is found
          alt="Person meditating in a serene environment, symbolizing manifestation and inner peace"
          fill
          className="object-cover opacity-40"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center py-12 sm:py-16 md:py-20">
          <div className="max-w-[800px] text-center px-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Unlock Your Potential, <span className="text-[#FFBD22]">Manifest Your Dreams</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 max-w-[600px] mx-auto">
              Harness the power of your mind and energy to create the life you desire. Personalized coaching in manifestation and energy alignment.
            </p>
            {/* Feature Points as Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 md:mb-12 w-full max-w-[900px] mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-4 sm:px-6 py-3 shadow-lg transform hover:scale-105 transition-all w-full"
                >
                  <div 
                    className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: feature.color }}
                  >
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-800 flex-1 text-left">{feature.text}</span>
                </div>
              ))}
            </div>
            {/* CTA Button */}
            <Button 
              className="bg-[#FFBD22] hover:bg-[#FFBD22]/90 text-black font-bold rounded-full px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
              onClick={() => window.open("https://calendly.com/strentor/strentor-services", "_blank")}
            >
              Begin Your Manifestation Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
