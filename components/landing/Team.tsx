"use client"

import { Card } from "@/components/ui/card"
import { Instagram } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface TeamMember {
  name: string
  role: string
  image: string 
  social: {
    instagram?: string
  }
}

export default function Team() {
  const team: TeamMember[] = [
    {
      name: "Aditya Mandan",
      role: "Founder & Empowerment Coach",
      image: "/Aditya.jpg",
      social: {
        instagram: "https://www.instagram.com/strentor/"
      }
    },
    {
      name: "Ashmita Dani",
      role: "Dreams to Reality Mentor",
      image: "/Ashmita.jpg",
      social: {
        instagram: "https://www.instagram.com/manifestd_?igsh=MTFzazI3NmlscThpcw=="
      }
    },
    {
      name: "Anisha Jhunjhunwala",
      role: "Mind & Emotions Specialist",
      image: "/Anisha.jpeg",
      social: {
        instagram: "https://www.instagram.com/healingwithanisha?igsh=ejZ5dnprNzJ6bXd3"
      }
    },
    // {
    //   name: "Arun Kunjunny",
    //   role: "Personal Transformation Architect",
    //   image: "/Arun.jpg",
    //   social: {
    //     instagram: "https://www.instagram.com/akunjunny?igsh=MXQ3dWJhNTEzZWh6NA=="
    //   }
    // }
  ]

  const handleSocialClick = (e: React.MouseEvent, link: string) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative w-full overflow-hidden py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-[#F31818]">Meet Our Team</h2>
          <p className="max-w-[900px] text-gray-700 font-semibold md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
            Our Expert Team is comprised of fitness specialists, psychological experts, and manifestation mentors. Together, they bring a holistic blend of knowledge and passion to empower your journey toward wellness and transformation.
          </p>
        </div>
        <div className="mx-auto mt-12">
          {/* make md 2 and lg 4 when there are 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 px-4"> 
            {team.map((member) => (
              <Link
                key={member.name}
                href={`/programs#${member.name.toLowerCase().replace(/\s+/g, "")}`}
                passHref
              >
                <Card
                  className="group relative overflow-hidden rounded-lg backdrop-blur-sm bg-white/10 border-white/20 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      priority={true}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{member.name}</h3>
                    <p className="text-sm text-gray-700 font-medium dark:text-zinc-400">{member.role}</p>
                    <div className="flex space-x-3 mt-4">
                      {member.social.instagram && (
                        <button
                          onClick={(e) => handleSocialClick(e, member.social.instagram!)}
                          className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          <Instagram className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}