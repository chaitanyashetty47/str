"use client"

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';

const TrainerProfile = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      {/* Headline Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Meet Your <span className="text-[#F31818]">Champion</span> Coach
        </h2>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          From breaking barriers as a para powerlifter to transforming lives through fitness
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div>
            <h2 className="text-5xl font-bold mb-4">Aditya Mandan</h2>
            <div className="inline-block bg-yellow-400 px-4 py-2 rounded-full">
              <span className="text-gray-900 font-semibold">Fitness and Nutrition Coaching</span>
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-blue-500">Qualifications</h3>
            <div className="space-y-3">
              {[
                "National-level Para Powerlifter",
                "Certified Fitness Trainer (Level 2, PEPT) and Nutrition Consultant"
              ].map((qualification, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <span className="text-lg text-gray-800">{qualification}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What We Offer */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#00D115]">What We Offer</h3>
            <div className="space-y-3">
              {[
                "Tailored Fitness Programs: From fat loss to powerlifting",
                "Holistic Transformation: Integrating physical, mental, and emotional well-being",
                "Inclusive Approach: Accessible and empowering fitness for everyone"
              ].map((offering, index) => (
                <div key={index} className="flex items-center gap-3">
                  <svg 
                    className="w-6 h-6 text-[#00D115] flex-shrink-0" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-lg text-gray-800">{offering}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative h-[600px] w-full">
          <Image
            src="/Aditya.jpg"
            alt="Aditya Mandan - Fitness and Nutrition Coach"
            fill
            className="object-cover rounded-lg"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default TrainerProfile; 