"use client"

const successStories = [
  {
    condition: "Trauma & Confidence Building", // Slightly more formal headline
    description: "Guided client in processing past trauma and developing coping mechanisms, resulting in significantly increased self-confidence and life engagement.",
    number: "01",
    color: "from-[#0D97FF]/10 to-[#0D97FF]/5",
    numberBg: "#0D97FF"
  },
  {
    condition: "Emotional Regulation Support", // Formal headline
    description: "Assisted client in navigating severe emotional distress by fostering emotional regulation skills, leading to improved clarity and emotional stability.",
    number: "02",
    color: "from-[#00D115]/10 to-[#00D115]/5",
    numberBg: "#00D115"
  },
  {
    condition: "Thought Pattern Management", // Formal headline
    description: "Facilitated client's understanding of emotional triggers and thought cycles, enabling them to manage difficult emotions effectively and gain new perspectives.",
    number: "03",
    color: "from-[#FFBD22]/10 to-[#FFBD22]/5",
    numberBg: "#FFBD22"
  },
  {
    condition: "Personal Resilience Development", // Formal headline
    description: "Strengthened client's mental health foundations and interpersonal skills, fostering greater resilience, confidence, and the ability to form positive relationships.",
    number: "04",
    color: "from-[#FFA500]/10 to-[#FFA500]/5",
    numberBg: "#FFA500"
  },
  {
    condition: "Therapeutic Support & Coping", // Formal headline
    description: "Provided a consistent, non-judgmental therapeutic environment, aiding the client in self-organization and enhancing their overall coping abilities.",
    number: "05",
    color: "from-[#F31818]/10 to-[#F31818]/5",
    numberBg: "#F31818"
  }
]

export default function PsychologicalSuccessStories() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real <span className="text-[#0D97FF]">Healing</span>, Real Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from those who have found clarity, strength, and peace through our psychological support programs.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* First Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {successStories.slice(0, 3).map((story, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 bg-gradient-to-br ${story.color} border border-gray-200 transition-all duration-300 hover:shadow-lg h-full flex flex-col`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: story.numberBg }}
                  >
                    <span className="text-xl font-bold text-white">{story.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">{story.condition}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed flex-grow">{story.description}</p>
              </div>
            ))}
          </div>

          {/* Second Row - Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:px-[16.666%]">
            {successStories.slice(3).map((story, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 bg-gradient-to-br ${story.color} border border-gray-200 transition-all duration-300 hover:shadow-lg h-full flex flex-col`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: story.numberBg }}
                  >
                    <span className="text-xl font-bold text-white">{story.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">{story.condition}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed flex-grow">{story.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 