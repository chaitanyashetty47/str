"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useState } from "react";
import { ContactForm } from "@/components/forms/ContactForm";
import { EmailCaptureModal } from "@/components/forms/EmailCaptureModal";
import { CalendlyEmbedModal } from "@/components/forms/CalendlyEmbedModal";
import Link from "next/link"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [showCalendlyEmbed, setShowCalendlyEmbed] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");

  const handleBookingClick = () => {
    setShowEmailCapture(true);
  };

  const handleEmailCaptured = (email: string) => {
    setCapturedEmail(email);
    setShowEmailCapture(false);
    setShowCalendlyEmbed(true);
  };

  return (
    <>
      <header className="container mx-auto px-4 border-b shadow-sm">
        <div className="flex items-center justify-between py-3 md:py-3">
          
          <div>
            <Link href="/" className="flex items-center">
              <Image
                src="/strentor.png"
                alt="Strentor Logo"
                width={120}
                height={240}
                className="w-38 h-28"
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={24} />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-5 items-center font-semibold">
            <a href="/" className="hover:text-red-500">Home</a>
            <a href="/aboutus" className="hover:text-red-500">About Us</a>
            <div className="relative group">
              <button className="hover:text-red-500 focus:outline-none flex items-center gap-1">
                Programs
{/* <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg> */}
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-50">
                <a href="/programs/fitness-training" className="block px-6 py-3 text-gray-800 hover:bg-gray-100 hover:text-[#F31818]">Fitness Training</a>
                <a href="/programs/psychological-support" className="block px-6 py-3 text-gray-800 hover:bg-gray-100 hover:text-[#F31818]">Psychological Support</a>
                <a href="/programs/manifestation-guidance" className="block px-6 py-3 text-gray-800 hover:bg-gray-100 hover:text-[#F31818] rounded-b-lg">Manifestation Guidance</a>
              </div>
            </div>
            <a href="/community" className="block hover:text-red-500 py-2">Community</a>
            <a href="https://empowerment-hub.strentor.com/"  className="block hover:text-red-500 py-2">Empowerment Hub</a>     
            <Button 
              className="shadow-2xl h-10 rounded-full bg-gradient-to-b from-red-500 to-red-700"
              onClick={handleBookingClick}
            >
              <span className="whitespace-pre-wrap text-center text-sm font-bold leading-none tracking-tight text-white lg:text-lg">
               Book Your Discovery Call
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t flex flex-col items-center font-semibold ">
            <a href="/" className="block hover:text-red-500 py-2">Home</a>
            <a href="/aboutus" className="block hover:text-red-500 py-2">About Us</a>
            <a href="/programs" className="block hover:text-red-500 py-2">Programs</a>      
            <a href="/community" className="block hover:text-red-500 py-2">Community</a>
            <a href="https://empowerment-hub.strentor.com/"  className="block hover:text-red-500 py-2">Empowerment Hub</a>     
            <Button 
              className="shadow-2xl h-10 rounded-full bg-gradient-to-b from-red-500 to-red-700"
              onClick={handleBookingClick}
            >
              <span className="whitespace-pre-wrap text-center text-sm font-bold leading-none tracking-tight text-white lg:text-lg">
               Book Your Discovery Call
              </span>
            </Button>
          </div>
        )}
      </header>

      {/* Contact Form Dialog */}
      <ContactForm open={showForm} onOpenChange={setShowForm} />
      
      {/* Email Capture Modal */}
      <EmailCaptureModal 
        open={showEmailCapture} 
        onOpenChange={setShowEmailCapture}
        onEmailCaptured={handleEmailCaptured}
      />
      
      {/* Calendly Embed Modal */}
      <CalendlyEmbedModal 
        open={showCalendlyEmbed}
        onOpenChange={setShowCalendlyEmbed}
        userEmail={capturedEmail}
      />
    </>
  );
}
