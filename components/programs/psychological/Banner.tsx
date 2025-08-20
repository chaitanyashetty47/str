"use client"

import React from 'react';
import { Button } from "@/components/ui/button";

const Banner = () => {
  
  return (
    <main>
      
      <section className="relative min-h-[300px] w-full overflow-hidden bg-gray-800">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl text-white font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Ready to Start Your Mental Wellbeing?
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-300 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Join hundreds of individuals who have transformed their lives with STRENTOR
            </p>
            <div className="mx-auto max-w-sm space-y-2">
              <Button
                className="w-full py-7 text-lg font-extrabold bg-[#F31818] hover:bg-[#F31818]/90"
                onClick={() => window.open("https://calendly.com/strentor/strentor-services", "_blank")}
              >
                Start Your Wellness Journey
              </Button>
              <p className="text-sm text-gray-400">
              Take the first step towards a stronger, happier you
            </p>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Banner;