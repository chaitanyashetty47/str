"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/forms/ContactForm"

const Banner = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <main>
      {/* <section className="relative min-h-[300px] w-full overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-500/20 to-pink-500/20">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Ready to Transform Your Wellness Journey?
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-700 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Join hundreds of individuals who have transformed their lives with STRENTOR
            </p>
            <div className="mx-auto max-w-sm space-y-2">
              
              <Button
                className="w-full py-7 text-lg font-extrabold bg-gradient-to-r from-red-600 to-orange-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowForm(true)}
              >
                Start Your Goals Today
              </Button>

              <ContactForm open={showForm} onOpenChange={setShowForm} />
            </div>
          </div>
        </div>
      </section> */}
      <section className="relative min-h-[300px] w-full overflow-hidden bg-gray-800">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl text-white font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Ready to Transform Your Fitness Journey?
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-300 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Join hundreds of individuals who have transformed their lives with STRENTOR
            </p>
            <div className="mx-auto max-w-sm space-y-2">
              <Button
                className="w-full py-7 text-lg font-extrabold bg-[#F31818] hover:bg-[#F31818]/90"
                onClick={() => window.open("https://calendly.com/strentor/strentor-services", "_blank")}
              >
                Start Your Fitness Journey
              </Button>

              <ContactForm open={showForm} onOpenChange={setShowForm} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Banner;