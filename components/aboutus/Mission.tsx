import React from 'react';
import { 
  Target, 
  HandshakeIcon, 
  Star 
} from 'lucide-react';

export function Mission() {
  return (
    <section className="bg-gradient-to-br from-gray-900 to-black text-white py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/50 to-gray-900 opacity-30"></div>
      <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-5xl font-extrabold mb-8 tracking-tight">
          <span className="text-[#FFBD22] drop-shadow-[0_0_10px_rgba(255,189,34,0.5)]">Our Mission</span>
        </h2>
        <p className="text-2xl text-gray-200 max-w-4xl mx-auto mb-16 leading-relaxed">
          <span className="text-[#FFBD22] font-bold">Inclusion</span> fuels our mission. We ensure our transformative programs remain 
          accessible to all—because true empowerment knows no economic barriers.
        </p>
        <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          <div className="bg-gray-800/70 backdrop-blur-sm p-8 rounded-xl border-t-4 border-[#F31818] shadow-2xl hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <Target className="text-[#F31818] mr-4" size={40} strokeWidth={2} />
              <h3 className="text-2xl font-bold text-[#F31818]">Vision</h3>
            </div>
            <p className="text-gray-300 text-lg">
              To create a world where every individual has the tools, support, and 
              opportunity to unlock their full potential.
            </p>
          </div>
          <div className="bg-gray-800/70 backdrop-blur-sm p-8 rounded-xl border-t-4 border-[#00D115] shadow-2xl hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <HandshakeIcon className="text-[#00D115] mr-4" size={40} strokeWidth={2} />
              <h3 className="text-2xl font-bold text-[#00D115]">Promise</h3>
            </div>
            <p className="text-gray-300 text-lg">
              To provide an inclusive space where diverse narratives unfold, and every 
              journey of transformation is celebrated.
            </p>
          </div>
          <div className="bg-gray-800/70 backdrop-blur-sm p-8 rounded-xl border-t-4 border-[#0D97FF] shadow-2xl hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <Star className="text-[#0D97FF] mr-4" size={40} strokeWidth={2} />
              <h3 className="text-2xl font-bold text-[#0D97FF]">Values</h3>
            </div>
            <p className="text-gray-300 text-lg">
              Empowerment, inclusivity, and continuous growth form the foundation 
              of everything we do.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Mission;