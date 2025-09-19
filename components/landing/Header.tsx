"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useState } from "react";
import { ContactForm } from "@/components/forms/ContactForm";
import { EmailCaptureModal } from "@/components/forms/EmailCaptureModal";
import { CalendlyEmbedModal } from "@/components/forms/CalendlyEmbedModal";
import Link from "next/link"
import { useRouter } from "next/navigation";
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [showCalendlyEmbed, setShowCalendlyEmbed] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");
  const router = useRouter();
  const handleBookingClick = () => {
    //setShowEmailCapture(true);
    router.push("/sign-up");
  };

  const handleEmailCaptured = (email: string) => {
    setCapturedEmail(email);
    setShowEmailCapture(false);
    setShowCalendlyEmbed(true);
  };

  return (
    <>
      <header className="container mx-auto px-4 border-b border-border shadow-sm bg-background">
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
            <a href="/" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="/aboutus" className="text-foreground hover:text-primary transition-colors">About Us</a>
            <div className="relative group">
              <button className="text-foreground hover:text-primary focus:outline-none flex items-center gap-1 transition-colors">
                Programs
{/* <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg> */}
              </button>
              <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-50">
                <a href="/programs/fitness-training" className="block px-6 py-3 text-card-foreground hover:bg-muted hover:text-primary transition-colors">Fitness Training</a>
                <a href="/programs/psychological-support" className="block px-6 py-3 text-card-foreground hover:bg-muted hover:text-primary transition-colors">Psychological Support</a>
                <a href="/programs/manifestation-guidance" className="block px-6 py-3 text-card-foreground hover:bg-muted hover:text-primary transition-colors rounded-b-lg">Manifestation Guidance</a>
              </div>
            </div>
            <a href="/community" className="block text-foreground hover:text-primary py-2 transition-colors">Community</a>
            <a href="https://empowerment-hub.strentor.com/"  className="block text-foreground hover:text-primary py-2 transition-colors">Empowerment Hub</a>     
            <Button 
              className="shadow-2xl h-10 rounded-full bg-strentor-red hover:bg-strentor-red/80 text-primary-foreground"
              onClick={handleBookingClick}
            >
              <span className="whitespace-pre-wrap text-center text-sm font-bold leading-none tracking-tight lg:text-lg">
               Sign Up
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border flex flex-col items-center font-semibold bg-background">
            <a href="/" className="block text-foreground hover:text-primary py-2 transition-colors">Home</a>
            <a href="/aboutus" className="block text-foreground hover:text-primary py-2 transition-colors">About Us</a>
            <a href="/programs" className="block text-foreground hover:text-primary py-2 transition-colors">Programs</a>      
            <a href="/community" className="block text-foreground hover:text-primary py-2 transition-colors">Community</a>
            <a href="https://empowerment-hub.strentor.com/"  className="block text-foreground hover:text-primary py-2 transition-colors">Empowerment Hub</a>     
            <Button 
              className="shadow-2xl h-10 rounded-full bg-strentor-red hover:bg-strentor-red/80 text-primary-foreground"
              onClick={handleBookingClick}
            >
              <span className="whitespace-pre-wrap text-center text-sm font-bold leading-none tracking-tight lg:text-lg">
               Sign Up
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
