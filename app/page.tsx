import Banner from "@/components/landing/Banner";
import FAQSection from "@/components/landing/FAQSection";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Team from "@/components/landing/Team";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";
import ProgramsCard from "@/components/landing/Programs";
import Introduction from "@/components/landing/Introduction";
import Featured from "@/components/landing/Featured";
import PopupForm from "@/components/landing/PopupForm";
import WhatsAppButton from "@/components/landing/WhatsAppButton";


export default function Home() {
  return (
    <div>
      <Header/>
      <Hero/>
      <Featured/>
      <Introduction/>
      <Testimonials/>
      <ProgramsCard/>
      <Team/>
      <Banner/>
      <FAQSection/>
      <Footer/>
      <PopupForm/>
      <WhatsAppButton/>
      
    </div>
    
  );
}
