"use client"
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "What is STRENTOR, and what are your core values?",
      answer: (
        <div className="space-y-4">
          <p>
            STRENTOR is a holistic empowerment brand dedicated to helping individuals discover their inner strength and achieve their full potential. Our name symbolizes strength and resilience, embodying our mission to break barriers and promote personal growth through fitness training, psychological support and manifestation guidance.
          </p>
          <div>
            <p>Our brand is built on four key values:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><b>Resilience:</b> Empowering individuals to overcome challenges</li>
              <li><b>Empowerment:</b> Helping clients discover and harness their inner strength</li>
              <li><b>Inclusivity:</b> Creating accessible and tailored solutions for all</li>
              <li><b>Transformation:</b> Driving meaningful personal growth and change</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      question: "What services does STRENTOR offer?",
      answer: (
        <div className="space-y-2">
          <p>We provide a comprehensive suite of services, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><b>Fitness Training:</b> Tailored programs to enhance physical health and fitness</li>
            <li><b>Psychological Support:</b> Access to mental health professionals and resources for emotional well-being</li>
            <li><b>Manifestation Guidance:</b> Techniques and practices to help manifest desired outcomes and enhance mindset</li>
          </ul>
          <p>Our holistic approach ensures that your physical, mental, and emotional well-being are addressed collectively.</p>
        </div>
      )
    },
    {
      question: "Who can benefit from STRENTOR's services?",
      answer: "STRENTOR is designed for anyone seeking empowerment and personal growth. Whether you're looking to enhance your fitness, improve mental health, achieve life goals, or manifest positive outcomes, we provide premium, inclusive solutions tailored to your unique challenges and aspirations."
    },
    {
      question: "How does STRENTOR ensure inclusivity in its services?",
      answer: "We prioritize accessibility and personalization. Our services are tailored to meet the diverse needs of individuals from all backgrounds and challenges. Our goal is to foster an environment where everyone feels supported and empowered, regardless of their circumstances."
    },
    {
      question: "What makes STRENTOR different from other wellness or coaching brands?",
      answer: "STRENTOR takes a holistic and integrated approach to empowerment, combining fitness, mental health support and manifestation guidance under one roof. Our emphasis on inclusivity, affordability, and personalized support sets us apart, creating a one-stop solution for overall well-being."
    },
    {
      question: "How can I get started with STRENTOR?",
      answer: "Getting started is simple! Visit our website to explore our range of services and select the ones that best fit your needs. You can also schedule a free consultation to discuss your goals and create a personalized plan."
    },
    {
      question: "Do you offer virtual services?",
      answer: (
        <div className="space-y-2">
          <p>Yes, all our services are available virtually, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><b>Fitness training</b></li>
            <li><b>Manifestation Guidance</b></li>
            <li><b>Psychological Support</b></li>
          </ul>
          <p>The results depend on your commitment, but we&apos;re here to support you every step of the way!</p>
        </div>
      )
    },
    {
      question: "What results can I expect from your programs?",
      answer: (
        <div className="space-y-2">
          <p>Our programs are designed to help you:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><b>Improve physical health and fitness</b></li>
            <li><b>Enhance mental clarity and emotional stability</b></li>
            <li><b>Achieve personal and professional goals</b></li>
            <li><b>Cultivate a positive and empowered mindset</b></li>
          </ul>
          <p>The results depend on your commitment, but we&apos;re here to support you every step of the way!</p>
        </div>
      )
    },
    {
      question: "Do you offer community support or group programs?",
      answer: "Yes, we believe in the power of community. Join our online groups to connect with others on similar journeys, share progress, and access exclusive content. We also host workshops, webinars, and live sessions to foster a sense of belonging and mutual support."
    },
    {
      question: "How do you ensure the quality of your services?",
      answer: "We regularly gather feedback through surveys and reviews to refine our offerings. Additionally, our team of experts is dedicated to continuous learning and improvement, ensuring you receive the best possible support and guidance."
    },
    {
      question: "Do you have any partnerships or corporate programs?",
      answer: "Yes, we collaborate with brands, influencers, and companies to extend our reach and impact. Our corporate inclusion programs and workshops focus on stress management, work-life balance, and personal growth. Reach out to learn how we can work together."
    }
  ];

  return (
    <section className="container mx-auto px-4 text-center mt-20 mb-20">
      <h2 className="text-5xl font-bold text-[#F31818] mb-8">
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg hover:text-red-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-left text-base font-normal text-gray-900">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;