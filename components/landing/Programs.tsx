"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const ProgramsCard = () => {
  const programs = [
    {
      icon: "/fitness.svg",
      title: "Fitness Training",
      description:
        "Personalized workout plans and nutrition guidance to help you achieve your fitness goals",
      gradient: "from-blue-500 to-purple-500",
    },
    {
      icon: "/manifestation.png",
      title: "Manifestation Guidance",
      description:
        "Discover your purpose and create a powerful personal manifestation for success",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: "/brains.svg",
      title: "Psychological Support",
      description:
        "Professional mental health support to enhance your emotional well-being",
      gradient: "from-orange-500 to-red-500",
    },
    // {
    //   icon: "/lifecoaching.png",
    //   title: "Life Coaching",
    //   description:
    //     "Strategic guidance to help you navigate life's challenges and achieve your dreams",
    //   gradient: "from-green-500 to-teal-500",
    // },
  ];

  return (
    <div className="relative w-full overflow-hidden py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Headline Section */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-[#F31818]">
            Our Programs
          </h2>
          <p className="max-w-[900px] text-gray-700 font-semibold md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400">
            Empower your journey with a range of tailored programs combining fitness training, manifestation mentoring and psychological support to ensure your success and transformation.
          </p>
        </div>

        {/* Programs Cards */}
        <div className="mx-auto mt-12">
          {/* make md to 2 and lg to 4 later on */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 px-6">
            {programs.map((program, index) => (
              <Card
                key={index}
                className="group bg-white hover:shadow-xl transition-all duration-300 border-none overflow-hidden relative"
              >
                <CardContent className="p-6 flex flex-col items-center relative z-10">
                  <div
                    className={`mb-6 rounded-full bg-gradient-to-r ${program.gradient} transform group-hover:scale-110 transition-transform duration-300 w-16 h-16 flex items-center justify-center`}
                  >
                      <div
                      className={`relative ${
                        program.icon === "/manifestation.png" ? "w-11 h-14 " : "w-10 h-10"
                      }`}
                    >
                      <Image
                        src={program.icon}
                        alt={program.title}
                        fill
                        sizes={program.icon === "/manifestation.png" ? "56px" : "32px"}
                        className="object-contain"
                        priority={index < 2}
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800 group-hover:text-gray-900">
                    {program.title}
                  </h3>
                  <p className="text-gray-700 font-bold leading-relaxed text-center text-muted-foreground">
                    {program.description}
                  </p>
                </CardContent>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${program.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
              </Card>
            ))}
          </div>
        </div>

        {/* <div className="mt-20">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-purple-800 mb-6">Why Choose Our Programs?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Tailored Approaches",
                  description: "Programs designed to fit your unique needs.",
                  icon: <Check className="text-green-700 w-8 h-8 mx-auto" />,
                },
                {
                  title: "Expert Coaches",
                  description: "Guidance from certified professionals.",
                  icon: <Star className="text-yellow-500 w-8 h-8 mx-auto" />,
                },
                {
                  title: "Holistic Transformation",
                  description: "Integrated mental, physical, and emotional support.",
                  icon: <Star className="text-purple-700 w-8 h-8 mx-auto" />,
                },
              ].map((item, index) => (
                <div key={index} className="p-6 bg-white rounded-lg shadow-md">
                  {item.icon}
                  <h3 className="text-xl font-bold text-purple-800 mt-4">{item.title}</h3>
                  <p className="text-sm text-purple-700 mt-2">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div> */}

      </div>
    </div>
  );
};

export default ProgramsCard;
