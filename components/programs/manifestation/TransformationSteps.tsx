"use client"

import  React  from 'react'
import { Eye, Sparkles, Gift, ShieldCheck, LucideIcon, Brain } from 'lucide-react' // Example icons
import Image from 'next/image' // If you plan to use custom image icons

interface TransformationStepItem {
  title: string;
  description: string;
  icon?: LucideIcon;
  isCustomIcon?: boolean;
  iconPath?: string;
  color: string;
  lightColor: string;
}

// Manifestation Transformation Steps
const transformationSteps: TransformationStepItem[] = [
  {
    title: "Clarify Your Vision",
    description: "Gain crystal-clear focus on your deepest desires and what you truly want to manifest.",
    icon: Eye, // Icon for vision, clarity
    color: "#FFC107", // Main Manifestation Yellow/Gold
    lightColor: "rgba(255, 193, 7, 0.1)"
  },
  {
    title: "Elevate Your Mindset",
    description: "Release limiting beliefs and cultivate a powerful mindset of abundance and possibility.",
    icon: Brain, // Icon for energy, mindset shift (could also be Brain)
    color: "#FFA000", // A slightly deeper gold/orange
    lightColor: "rgba(255, 160, 0, 0.1)"
  },
  {
    title: "Align Your Energy",
    description: "Harmonize your thoughts, feelings, and actions to become a vibrational match for your goals.",
    icon: Sparkles, // Icon for alignment, magic, positive energy
    color: "#FF8F00", // Orange for energy and action
    lightColor: "rgba(255, 143, 0, 0.1)"
  },
  {
    title: "Embrace Inspired Action",
    description: "Learn to recognize and act on intuitive nudges and opportunities that lead you to your dreams.",
    icon: Gift, // Using Gift as a metaphor for receiving opportunities or inspired ideas (could be Lightbulb)
    color: "#FFA040", // A stronger orange for action
    lightColor: "rgba(255, 111, 0, 0.1)"
  },
  {
    title: "Embody Your Future Self",
    description: "Step into the confidence and belief of already having achieved your desires, and trust the unfolding.",
    icon: ShieldCheck, // Icon for trust, confidence, security
    color: "#FFD700", // A classic gold for embodiment and achievement
    lightColor: "rgba(255, 215, 0, 0.1)"
  }
]

export default function ManifestationTransformationSteps() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-800">
            Your Path to <span className="text-[#FFBD22]">Conscious Creation</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Key transformations you&apos;ll experience as you master the art of manifestation with us.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4 md:space-y-5">
          {transformationSteps.map((item, index) => (
            <div 
              key={index}
              className="flex items-center rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-transparent hover:border-yellow-300"
            >
              <div 
                className="w-20 md:w-28 flex-shrink-0 flex items-center justify-center p-4 md:p-5"
                style={{ backgroundColor: item.lightColor }}
              >
                {item.isCustomIcon && item.iconPath ? (
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 relative"
                  >
                    <Image
                      src={item.iconPath}
                      alt={item.title}
                      width={40}
                      height={40}
                      className="object-contain"
                      // Optional: Add filter for custom icon color if needed, similar to FitnessTransformations
                    />
                  </div>
                ) : (
                  item.icon && <item.icon 
                    className="w-8 h-8 md:w-10 md:h-10"
                    style={{ color: item.color }}
                  />
                )}
              </div>
              <div className="flex-1 p-4 md:p-5">
                <h3 className="text-md md:text-lg font-bold text-gray-800">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm md:text-base mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
