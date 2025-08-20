"use client"

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react'; // Assuming Star icon is appropriate, or replace if needed

const PsychologicalTrainerProfile = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      {/* Headline Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Meet Your Guide to <span className="text-[#0D97FF]">Emotional Wellness</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Compassionate, evidence-based therapy to help you navigate life&apos;s challenges and foster resilience with Anisha Jhunjhunwala.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          <div>
            <h2 className="text-5xl font-bold mb-4">Anisha Jhunjhunwala</h2>
            <div className="inline-block bg-[#FFBD22] px-4 py-2 rounded-full">
              <span className="text-gray-900 font-semibold">Emotional Wellness and Therapy</span>
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-blue-500">Qualifications</h3>
            <div className="space-y-3">
              {[
                "Master's in Psychology and specialized training from NIMHANS, Bangalore",
                "Over 2,000 hours of therapy with 450 individuals",
                "Skilled in CBT, REBT, SFBT, and Person-Centered Therapy"
              ].map((qualification, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-[#FFBD22] flex-shrink-0" />
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
                "Personalized Therapy: Tailored sessions for depression, anxiety, self-esteem, and relationship challenges",
                "Safe and Confidential Space: Non-judgmental environment for client support",
                "Empowerment and Growth: Focus on self-discovery and resilience building"
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
            src="/Anisha.jpeg"
            alt="Anisha Jhunjhunwala - Emotional Wellness and Therapy"
            fill
            className="object-cover rounded-lg"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default PsychologicalTrainerProfile; 