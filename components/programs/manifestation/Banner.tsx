"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
// Removed ContactForm import as it's not used directly in this version of banner
// import { ContactForm } from "@/components/forms/ContactForm"

const ManifestationBanner = () => {
  // const [showForm, setShowForm] = useState(false); // Not used if linking directly to Calendly

  return (
    <main>
      <section className="relative min-h-[300px] w-full overflow-hidden bg-gray-800">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl text-white font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Ready to <span style={{ color: '#FFBD22' }}>Manifest Your Dream Life</span>?
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-300 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Take the first step towards creating the reality you desire with STRENTOR.
            </p>
            <div className="mx-auto max-w-sm space-y-2">
              <Button
                className="w-full py-7 text-lg font-extrabold text-black rounded-md"
                style={{ backgroundColor: '#FFBD22' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFB000'} // Darken on hover
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFBD22'} // Revert on mouse out
                onClick={() => window.open("https://calendly.com/strentor/strentor-services", "_blank")}
              >
                Start Manifesting Today
              </Button>

              {/* <ContactForm open={showForm} onOpenChange={setShowForm} /> */}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ManifestationBanner;
