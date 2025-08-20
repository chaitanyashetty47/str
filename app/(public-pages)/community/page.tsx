"use client"

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

const communityGroups = [
  {
    title: "STRENTOR Main Community",
    description: "Your hub for general updates, announcements, and discussions across all services.",
    icon: "/strentorfav.png",
    color: "from-[#ffde21]/10 to-[#ffde21]/5",
    buttonColor: "bg-[#ffde21] hover:bg-[#ffde21]/90",
    whatsappLink: "https://chat.whatsapp.com/GJRdI9y1NRkFei0IosUAlL"
  },
  {
    title: "Fitness Group",
    description: "For those focused on physical health and fitness, this group shares workouts, fitness tips, and motivational content.",
    icon: "/fitness.svg",
    color: "from-[#F31818]/10 to-[#F31818]/5",
    buttonColor: "bg-[#F31818]/70 hover:bg-[#F31818]/90",
    whatsappLink: "https://chat.whatsapp.com/EYr2NBxdcPoFKoj3TFmKQr"
  },
  {
    title: "Manifestation Guidance Group",
    description: "Explore techniques, tools, and stories to help you manifest your dreams and cultivate positivity.",
    icon: "/manifestation.png",
    color: "from-[#FFA500]/10 to-[#FFA500]/5",
    buttonColor: "bg-[#FFA500] hover:bg-[#FFA500]/90",
    
    whatsappLink: "https://chat.whatsapp.com/ExgtHr6bvmD3Ktq7ILuXQd"
  },
  {
    title: "Psychological Support Group",
    description: "A safe space to discuss mental health, share resources, and build emotional well-being.",
    icon: "/brains.svg",
    color: "from-[#0D97FF]/10 to-[#0D97FF]/5",
    buttonColor: "bg-[#0D97FF]/65 hover:bg-[#0D97FF]/90",
    whatsappLink: "https://chat.whatsapp.com/Lwxyq6gXujrL0ICb2shVkW"
  },
  // {
  //   title: "Life Coaching Group",
  //   description: "Focused on personal growth, goal-setting, and achieving your full potential.",
  //   icon: "/lifecoaching.png",
  //   color: "from-[#00D115]/10 to-[#00D115]/5",
  //   buttonColor: "bg-[#00D115] hover:bg-[#00D115]/90",
  //   whatsappLink: "https://chat.whatsapp.com/BW8s55o0pLCHCimnM0za3x"
  // },
  
];


export default function CommunityPage() {
  return (
    <main className="min-h-screen">
      <Header/>
      {/* Hero Section */}
      <div className="relative h-[50vh] bg-black">
        <Image
          src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070"
          alt="Community collaboration"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Join Our <span className="text-[#F31818]">Community</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl">
            Connect, grow, and transform with like-minded individuals
          </p>
        </div>
      </div>

      {/* Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to the <span className="text-[#F31818]">STRENTOR</span> Community!
          </h2>
          <p className="text-lg text-gray-900 font-semibold leading-relaxed">
            We are excited to have you join our journey of holistic empowerment and personal growth. 
            Our community is designed to inspire, support, and guide individuals through a range of 
            specialized services.
          </p>
        </div>

        {/* Community Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {communityGroups.map((group, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 bg-gradient-to-br ${group.color} border border-gray-200`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-black p-3 shadow-md">
                  <div className="relative w-8 h-8">
                    <Image
                      src={group.icon}
                      alt={`${group.title} icon`}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{group.title}</h3>
                    <p className="text-gray-600 mt-1">{group.description}</p>
                  </div>
                  <a
                    href={group.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block px-6 py-2 rounded-full text-black font-bold ${group.buttonColor} transition-colors duration-200`}
                  >
                    Join Group
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        
      </section>
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
    </main>
  );
}