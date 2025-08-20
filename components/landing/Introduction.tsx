"use client"
import { IntroHeader } from '@/components/landing/intro/IntroHeader'
import { IntroContent } from '@/components/landing/intro/IntroContent'

export default function Introduction() {
  return (
    <section className="">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <IntroHeader />
        <div className="mt-16 max-w-6xl mx-auto">
          <IntroContent />
        </div>
      </div>
    </section>
  );
}