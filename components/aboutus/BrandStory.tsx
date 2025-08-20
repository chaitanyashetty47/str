import Image from 'next/image';

export function BrandStory() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[#0D97FF] font-semibold text-5xl">Our Story</span>
          <h2 className="text-3xl font-bold text-gray-900">
            A Movement of <span className="text-[#F31818]">Transformation</span>
          </h2>
          <div className="space-y-4 text-lg text-gray-700 font-semibold leading-relaxed">
            <p>
              STRENTOR was born from a vision of transformation - a sanctuary for the bold, 
              the resilient, the dreamers, and the doers. Here, strength isn&apos;t measured 
              by how much you can carry but by how much you can overcome.
            </p>
            <p>
              Through our Empowerment Mosaic, we&apos;ve redefined what it means to grow 
              stronger. By blending fitness training, psychological support  
              and manifestation guidance, we create a holistic approach to personal development.
            </p>
          </div>
        </div>
        <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/transformation.png"
            alt="Empowerment in action"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}