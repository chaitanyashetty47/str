import { HeroSection } from '@/components/aboutus/HeroSection';
import { BrandStory } from '@/components/aboutus/BrandStory';
import { Mission } from '@/components/aboutus/Mission';
import { FounderStory } from '@/components/aboutus/Founder';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen ">
      <Header/>
      <HeroSection />
      <BrandStory />
      <Mission />
      
      <FounderStory />
      <Footer/>
    </main>
  );
}




