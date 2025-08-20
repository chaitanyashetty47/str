import Image from 'next/image';

export function HeroSection() {
  return (
    <div className="relative h-[70vh] bg-black">
      <Image
        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070"
        alt="Strength and empowerment"
        fill
        className="object-cover opacity-30"
        priority
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Empowering Beyond <span className="text-[#F31818]">Limits</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl">
          Where strength meets purpose, and resilience knows no bounds
        </p>
      </div>
    </div>
  );
}