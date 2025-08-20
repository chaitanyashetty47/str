import Image from 'next/image';

export function FounderStory() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
          <Image
            // src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974"
            src="/Me.png"           
            alt="Founder portrait"
            fill
            className="object-fit"
          />
        </div>
        <div className="space-y-6">
          <span className="text-[#0D97FF] text-5xl font-semibold">Founder&apos;s Story</span>
          <h2 className="text-3xl font-bold text-gray-900">
            A Journey of <span className="text-[#F31818]">Purpose</span>
          </h2>
          <div className="space-y-4 text-lg font-semibold text-gray-600 leading-relaxed">
            <p>
              As a para powerlifter, I intimately understand the multifaceted battles our 
              community endures—transcending mere physical barriers to confront mental, 
              emotional, psychological, and financial hurdles.
            </p>
            <p>
              This deep comprehension ignited an unwavering passion within me, compelling 
              me to spearhead STRENTOR. It&apos;s not merely a project; it embodies our 
              relentless commitment to empowering individuals to surmount obstacles 
              and flourish.
            </p>
            <p className="text-xl font-semibold text-[#00D115] mt-6">
            &quot;The only impossible journey is the one you never begin.&quot;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}