"use client";

import React, { useState, useEffect } from "react";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
}

const TestimonialCard = ({ quote, author }: TestimonialCardProps) => (
  <div className="p-8 bg-white rounded-xl shadow-lg text-center flex flex-col items-center h-full">
    <Quote className="w-10 h-10 text-[#FFBD22] mb-6" />
    <p className="text-gray-900 font-semibold text-lg leading-relaxed mb-6">{quote}</p>
    <div className="mt-auto flex flex-col items-center">
      <div className="h-1 w-16 bg-gradient-to-r from-[#F31818] via-[#00D115] to-[#0D97FF] mb-4"></div>
      <p className="font-semibold">
        <span className="text-[#F31818] text-lg">{author}</span>
      </p>
    </div>
  </div>
);

const TestimonialCardMobile = ({ quote, author }: TestimonialCardProps) => (
  <div className="p-6 bg-white rounded-xl shadow-lg text-center flex flex-col items-center h-full">
    <Quote className="w-8 h-8 text-[#FFBD22] mb-4" />
    <p className="text-gray-900 font-semibold text-base leading-relaxed mb-4">{quote}</p>
    <div className="mt-auto flex flex-col items-center">
      <div className="h-1 w-12 bg-gradient-to-r from-[#F31818] via-[#00D115] to-[#0D97FF] mb-3"></div>
      <p className="font-semibold text-sm">
        <span className="text-[#F31818]">{author}</span>
      </p>
    </div>
  </div>
);

export default function Testimonials() {
   
  const testimonials = [
    {
      quote:
        "Working with Aditya for over a year now and he is arguably the best fitness coach you could ask for. From personalized workouts to diet, he takes care of everything. Having Spina Bifida, I had my doubts whether lifting heaving weights is for me but he helped overcome those hurdles with ease!",
      author: "Chaitanya Shetty",
    },
    {
      quote:
        "Ashmita Dani has been a transformative guide and mentor in my life. Her coaching helped me shift my mindset, take charge, and align my actions with my goals.  I have achieved milestones that once seemed distant, all thanks to Ashmita’s approach to life and guidance",
      author: "Ambika Batra",
    },
    {
      quote:
        "Anisha is amazing at her work, she is extremely professional and yet friendly, anyone can open up to her and share out their issues, their concerns and she will surely guide you in the bestest way possible.  I feel very safe and happy everytime I speak to her 😊",
      author: "Divya Manji",
    },
    {
      quote:
        "Aditya is a brilliant trainer. He pushed me when it was needed and cherished every fitness milestone that I achieved.",
      author: "Tanushree Das",
    },
    {
      quote: "Sessions with Ashmita are highly recommended for anyone seeking direction or inner peace.",
      author: "Bhargav Shah",
    },
    {
      quote:
        "The sessions with Anisha have strengthened my mental health and helped me in personal growth .This  also made changes in me as a person to be a better confident and strong human.",
      author: "Manan Damwala",
    },
    {
      quote:
        "Working with Aditya I've seen good results in the past few months! My workouts are constantly increasing in difficulty and scope focused to match my fitness goals. Aditya suggests exercise routines that are individualized and challenging, but not more than I handle.",
      author: "Promila Dsilva",
    },
    {
      quote:
        "I am thrilled to recommend Ashmita for her profound insights and effective guidance in manifesting desires. Ashmita's workshop was a revealation, offering a holistic approach to mental health and manifestation that resonated deeply with me. ",
      author: "Kavita Waghani",
    },
    {
      quote:
        "I have been with Anisha for over a year now and have had received great help through these sessions. I have had so much help from her and have been finding it easier to navigate through life. She has helped me accept and improve various aspects of my life.",
      author: "Anandita Kar",
    },
  ];

  const [position, setPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const cardWidth = isMobile ? 100 : 100 / 3;
  const totalWidth = testimonials.length * cardWidth;

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768); // Adjust breakpoint for mobile
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const animation = () => {
      setPosition((prevPosition) => {
        const newPosition = prevPosition - 0.3; // Adjust the speed
        return Math.abs(newPosition) >= totalWidth ? 0 : newPosition;
      });
    };
    const animationFrame = setInterval(animation, 50);
    return () => clearInterval(animationFrame);
  }, [totalWidth]);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
          Transforming Lives, <span className="text-[#F31818]">One Story</span> at a Time
        </h2>

        <div className="relative w-full overflow-hidden">
          {/* Fade effect overlays */}
          <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-white to-transparent z-10"></div>

          {/* Testimonial cards */}
          <div
            className="flex gap-4 transition-transform duration-75 ease-linear"
            style={{
              transform: `translateX(${position}%)`,
            }}
          >
            {testimonials.map((testimonial, idx) => (
              <div key={`first-${idx}`} className={`${isMobile ? "w-full px-2" : "w-1/3 px-4"} flex-shrink-0`}>
                {isMobile ? (
                  <TestimonialCardMobile quote={testimonial.quote} author={testimonial.author} />
                ) : (
                  <TestimonialCard quote={testimonial.quote} author={testimonial.author} />
                )}
              </div>
            ))}
            {/* Duplicate first three cards for smooth transition */}
            {testimonials.slice(0, 3).map((testimonial, idx) => (
              <div key={`duplicate-${idx}`} className={`${isMobile ? "w-full px-2" : "w-1/3 px-4"} flex-shrink-0`}>
                {isMobile ? (
                  <TestimonialCardMobile quote={testimonial.quote} author={testimonial.author} />
                ) : (
                  <TestimonialCard quote={testimonial.quote} author={testimonial.author} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
// "use client";

// import React from "react";
// import { Quote } from "lucide-react";

// interface TestimonialCardProps {
//   quote: string;
//   author: string;
// }

// const TestimonialCard = ({ quote, author }: TestimonialCardProps) => (
//   <div className="p-8 bg-white rounded-xl shadow-lg text-center flex flex-col items-center h-full">
//     <Quote className="w-10 h-10 text-[#FFBD22] mb-6" />
//     <p className="text-gray-900 font-semibold text-lg leading-relaxed mb-6">{quote}</p>
//     <div className="mt-auto flex flex-col items-center">
//       <div className="h-1 w-16 bg-gradient-to-r from-[#F31818] via-[#00D115] to-[#0D97FF] mb-4"></div>
//       <p className="font-semibold">
//         <span className="text-[#F31818] text-lg">{author}</span>
//       </p>
//     </div>
//   </div>
// );

// const TestimonialCardMobile = ({ quote, author }: TestimonialCardProps) => (
//   <div className="p-6 bg-white rounded-xl shadow-lg text-center flex flex-col items-center h-full">
//     <Quote className="w-8 h-8 text-[#FFBD22] mb-4" />
//     <p className="text-gray-900 font-semibold text-base leading-relaxed mb-4">{quote}</p>
//     <div className="mt-auto flex flex-col items-center">
//       <div className="h-1 w-12 bg-gradient-to-r from-[#F31818] via-[#00D115] to-[#0D97FF] mb-3"></div>
//       <p className="font-semibold text-sm">
//         <span className="text-[#F31818]">{author}</span>
//       </p>
//     </div>
//   </div>
// );

// export default function Testimonials() {
//   const testimonials = [
//     {
//       quote:
//         "Working with Aditya for over a year now and he is arguably the best fitness coach you could ask for. From personalized workouts to diet, he takes care of everything. Having Spina Bifida, I had my doubts whether lifting heaving weights is for me but he helped overcome those hurdles with ease!",
//       author: "Chaitanya Shetty",
//     },
//     {
//       quote:
//         "Ashmita Dani has been a transformative guide and mentor in my life. Her coaching helped me shift my mindset, take charge, and align my actions with my goals.  I have achieved milestones that once seemed distant, all thanks to Ashmita’s approach to life and guidance",
//       author: "Ambika Batra",
//     },
//     {
//       quote:
//         "Anisha is amazing at her work, she is extremely professional and yet friendly, anyone can open up to her and share out their issues, their concerns and she will surely guide you in the bestest way possible.  I feel very safe and happy everytime I speak to her 😊",
//       author: "Divya Manji",
//     },
//     {
//       quote:
//         "Aditya is a brilliant trainer. He pushed me when it was needed and cherished every fitness milestone that I achieved.",
//       author: "Tanushree Das",
//     },
//     {
//       quote: "Sessions with Ashmita are highly recommended for anyone seeking direction or inner peace.",
//       author: "Bhargav Shah",
//     },
//     {
//       quote:
//         "Anisha, my long-time psychologist, helps me manage the mental & emotional challenges of living with the physical challenge.",
//       author: "Aditya Mandan",
//     },
//     {
//       quote:
//         "Working with Aditya I've seen good results in the past few months! My workouts are constantly increasing in difficulty and scope focused to match my fitness goals. Aditya suggests exercise routines that are individualized and challenging, but not more than I handle.",
//       author: "Promila Dsilva",
//     },
//     {
//       quote:
//         "I am thrilled to recommend Ashmita for her profound insights and effective guidance in manifesting desires. Ashmita's workshop was a revealation, offering a holistic approach to mental health and manifestation that resonated deeply with me. ",
//       author: "Kavita Waghani",
//     },
//     {
//       quote:
//         "I have been with Anisha for over a year now and have had received great help through these sessions. I have had so much help from her and have been finding it easier to navigate through life. She has helped me accept and improve various aspects of my life.",
//       author: "Anandita Kar",
//     },
//   ];

//   return (
//     <section className="py-16">
//          <div className="max-w-7xl mx-auto px-4">
//            <h2 className="text-4xl md:text-5xl font-bold  text-center">
//            Transforming Lives, <span className="text-[#F31818]">One Story</span> at a Time
//            </h2>
//             <div className="container mx-auto px-4 py-12">
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                 {testimonials.map((testimonial, index) => (
//                   <div key={index} className="hidden md:block">
//                     <TestimonialCard
//                       quote={testimonial.quote}
//                       author={testimonial.author}
//                     />
//                   </div>
//                 ))}
//                 {testimonials.map((testimonial, index) => (
//                   <div key={`mobile-${index}`} className="md:hidden">
//                     <TestimonialCardMobile
//                       quote={testimonial.quote}
//                       author={testimonial.author}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//         </div>
    
//     </section>

// );
// }