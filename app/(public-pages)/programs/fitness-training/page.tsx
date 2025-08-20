"use client"

import Header from '@/components/landing/Header'
import Banner from '@/components/programs/fitness/Banner'
import Footer from "@/components/landing/Footer"
import FitnessHero from "@/components/programs/fitness/Hero"
import SuccessStories from "@/components/programs/fitness/SuccessStories"
import Transformations from "@/components/programs/fitness/Transformations"
import FitnessTestimonials from "@/components/programs/fitness/Testimonials"
import TrainerProfile from "@/components/programs/fitness/TrainerProfile"

export default function FitnessPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <FitnessHero />
      <TrainerProfile />
      <SuccessStories />
      <Transformations />
      <FitnessTestimonials />
      <Banner />
      <Footer />
    </div>
  )
}
