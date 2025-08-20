"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Star, Check } from 'lucide-react'
import Header from '@/components/landing/Header';
import Footer from "@/components/landing/Footer"

export default function TeamPage() {
  const teamMembers = [
    {
      name: "Aditya Mandan",
      role: "Fitness and Nutrition Coaching",
      image: "/Aditya.jpg",
      qualifications: [
        "National-level Para Powerlifter",
        "Certified Fitness Trainer (Level 2, PEPT) and Nutrition Consultant",
      ],
      offerings: [
        "Tailored Fitness Programs: From fat loss to powerlifting",
        "Holistic Transformation: Integrating physical, mental, and emotional well-being",
        "Inclusive Approach: Accessible and empowering fitness for everyone",
      ],
    },
    {
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
    },
    {

      name: "Anisha Jhunjhunwala",
      role: "Emotional Wellness and Therapy",
      image: "/Anisha.jpeg",
      qualifications: [
        "Master's in Psychology and specialized training from NIMHANS, Bangalore",
        "Over 2,000 hours of therapy with 450 individuals",
        "Skilled in CBT, REBT, SFBT, and Person-Centered Therapy",
      ],
      offerings: [
        "Personalized Therapy: Tailored sessions for depression, anxiety, self-esteem, and relationship challenges",
        "Safe and Confidential Space: Non-judgmental environment for client support",
        "Empowerment and Growth: Focus on self-discovery and resilience building",
      ],
    },
    
    
    
  ]

  return (
    <div className="min-h-screen">
      <Header/>
      <div className="relative h-[40vh] bg-black mb-16">
        <Image
          src="https://images.unsplash.com/photo-1593810450967-f9c42742e326?q=80&w=2070"
          alt="Team collaboration"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Our <span className="text-[#F31818]">Programs</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl">
            Experts dedicated to your holistic transformation
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-16">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              id={member.name.toLowerCase().replace(/\s+/g, "")} // Generate IDs like "anishajhunjhunwala"
              className="overflow-hidden border-none shadow-xl"
            >
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-8 space-y-6 order-2 md:order-none">
                    <div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-2">
                        {member.name}
                      </h2>
                      <Badge className="bg-[#FFBD22] text-black text-md font-semibold">
                        {member.role}
                      </Badge>
                      <div className="mt-8 space-y-20">
                        <div>
                          <h3 className="text-lg font-semibold text-[#0D97FF] mb-4">
                            Qualifications
                          </h3>
                          <ul className="space-y-3 text-gray-700 font-bold">
                            {member.qualifications.map((qual, idx) => (
                              <li key={idx} className="flex items-start">
                                <Star className="h-5 w-5 text-[#FFBD22] mt-1 mr-3 flex-shrink-0" />
                                <span>{qual}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#00D115] mb-4">
                            What We Offer
                          </h3>
                          <ul className="space-y-3 text-gray-700 font-bold">
                            {member.offerings.map((offer, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check className="h-5 w-5 text-[#00D115] mt-1 mr-3 flex-shrink-0" />
                                <span>{offer}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-8">
                        <Button
                          className="bg-[#F31818] hover:bg-[#F31818]/90 text-lg font-bold text-white rounded-full px-8 py-6 group"
                          onClick={() => window.location.href = '/programs/fitness'}
                        >
                          Find Out More <span className="group-hover:translate-x-1 transition-transform inline-block ml-1">→</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-[600px] bg-gray-100 order-1 md:order-none">
                    <Image
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* <div className="text-center py-20 bg-gradient-to-br from-blue-600/20 via-purple-500/20 to-pink-500/20"> */}
      <div className="text-center py-20 bg-gray-900">
          <h2 className="text-4xl font-bold text-white mb-4 sm:text-5xl md:text-6xl lg:text-7xl">
            Ready to Begin Your <span className="text-[#F31818]">Journey</span>?
          </h2>
          <p className="mx-auto max-w-[700px] text-gray-300 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 pb-8 pt-2">
            Take the first step towards transformation with our expert team of coaches and mentors.
          </p>
          <Button 
            className="bg-[#F31818] hover:bg-[#F31818]/90 text-white font-bold rounded-full px-8 py-6 text-lg"
            onClick={() => window.open("https://calendly.com/strentor/strentor-services", "_blank")}
          >
            Start Your Transformation
          </Button>
      </div>
      <Footer/>
    </div>
  )
}