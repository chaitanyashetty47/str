"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Star, Check } from "lucide-react"

const trainer = {
  name: "Ashmita Dani",
  role: "Manifestation and Energy Coaching",
  image: "/Ashmita.jpg",
  qualifications: [
    "In-depth research into energy science and quantum physics",
    "Expertise in merging spirituality with scientific methods",
  ],
  offerings: [
    "Manifesting Mojo Sessions: 1:1 coaching to shift energy and align with goals",
    "Mindset and Energy Work: Address blockages to unlock transformation",
    "Practical and Personalized: Data-backed strategies with spiritual insights",
  ],
  headline: "Meet Your Guide to Conscious Creation",
  subHeadline: "Unlock your innate power to manifest your desires with Ashmita Dani, blending spiritual wisdom with practical techniques.",
  accentColor: "#FFBD22", // Manifestation Yellow/Gold
  roleBadgeColor: "bg-yellow-400 hover:bg-yellow-400/90", // A yellow that works for badges
}

export default function ManifestationTrainerProfile() {
  return (
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            {trainer.headline.split(' ').slice(0, -1).join(' ')} <span style={{ color: trainer.accentColor }}>{trainer.headline.split(' ').pop()}</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {trainer.subHeadline}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text Content Area */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-1">{trainer.name}</h3>
              <Badge className={`${trainer.roleBadgeColor} text-sm font-semibold text-black py-1 px-3`}>{trainer.role}</Badge>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                <Star className="w-6 h-6 mr-2" style={{ color: trainer.accentColor }} />
                Core Qualifications
              </h4>
              <ul className="space-y-2 text-gray-600 pl-1">
                {trainer.qualifications.map((qual, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 mt-1 mr-2 flex-shrink-0" style={{ color: trainer.accentColor }} />
                    <span>{qual}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                <Check className="w-6 h-6 mr-2" style={{ color: trainer.accentColor }} />
                Key Offerings
              </h4>
              <ul className="space-y-2 text-gray-600 pl-1">
                {trainer.offerings.map((offer, idx) => (
                  <li key={idx} className="flex items-start">
                    <Sparkles className="w-5 h-5 mt-1 mr-2 flex-shrink-0" style={{ color: trainer.accentColor }} /> {/* Using Sparkles for offerings */}
                    <span>{offer}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Image Area */}
          <div className="relative h-80 md:h-[500px] rounded-lg overflow-hidden shadow-xl order-first md:order-last">
            <Image
              src={trainer.image}
              alt={`${trainer.name} - ${trainer.role}`}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Adding Sparkles to imports if not already there for Key Offerings icon
import { Sparkles } from 'lucide-react';
