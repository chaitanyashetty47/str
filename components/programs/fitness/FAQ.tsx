"use client"

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FitnessFAQ = () => {
  const faqs = [
    {
      question: "What makes STRENTOR's fitness program unique?",
      answer: "Our fitness program is specifically designed for individuals with chronic conditions and physical challenges. We focus on personalized training that adapts to your unique needs, ensuring safe and effective progress while working around your specific conditions."
    },
    {
      question: "Can I exercise safely with my condition?",
      answer: (
        <div className="space-y-2">
          <p>Yes! We specialize in creating safe workout programs for various conditions, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Type-2 Diabetes</li>
            <li>Cerebral Palsy</li>
            <li>Thyroid Issues</li>
            <li>Down&apos;s Syndrome</li>
            <li>Spina Bifida</li>
          </ul>
          <p>Our expert trainers will design a program that considers your specific condition and limitations.</p>
        </div>
      )
    },
    {
      question: "How are the training sessions conducted?",
      answer: "All our training sessions are conducted virtually, allowing you to work out from the comfort of your home. We provide real-time guidance, form corrections, and continuous support through video calls. This approach ensures you get professional supervision while maintaining convenience and comfort."
    },
    {
      question: "What equipment do I need to get started?",
      answer: "We design programs that can be done with minimal equipment. Basic requirements might include resistance bands, light dumbbells, and a yoga mat. We'll provide specific recommendations based on your program and goals, and many exercises can be modified to use household items or bodyweight."
    },
    {
      question: "How often will I need to exercise?",
      answer: "The frequency of workouts depends on your current fitness level, goals, and condition. Typically, we recommend 3-4 sessions per week, but this is fully customizable. We'll work together to create a schedule that fits your lifestyle and energy levels."
    },
    {
      question: "Will I get dietary guidance along with the fitness program?",
      answer: "Yes, we provide basic nutritional guidance as part of our fitness program. We'll help you understand how to fuel your body properly for your workouts while considering any dietary restrictions related to your condition."
    },
    {
      question: "How long before I see results?",
      answer: "Results vary based on individual factors, but most clients start noticing improvements in strength, mobility, and energy levels within 4-6 weeks of consistent training. We track progress regularly and adjust your program to ensure continuous improvement."
    },
    {
      question: "What support is available between sessions?",
      answer: "You'll have access to our support system through WhatsApp for quick questions and guidance. We also provide detailed workout logs, progress tracking, and regular check-ins to ensure you're staying on track with your goals."
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
        Common <span className="text-[#F31818]">Questions</span>
      </h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg hover:text-[#F31818]">
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

export default FitnessFAQ; 