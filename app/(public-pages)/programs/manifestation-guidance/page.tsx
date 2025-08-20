import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ManifestationHero from "@/components/programs/manifestation/Hero";
import ManifestationTrainerProfile from "@/components/programs/manifestation/TrainerProfile";
import ManifestationBanner from "@/components/programs/manifestation/Banner";
import TransformationSteps from "@/components/programs/manifestation/TransformationSteps";
import ManifestationTestimonials from "@/components/programs/manifestation/Testimonials"



export default function ManifestationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <ManifestationHero />
        <ManifestationTrainerProfile />
        <TransformationSteps />
        <ManifestationTestimonials />
        <ManifestationBanner />
      </main>
      <Footer />
    </div>
  );
}
