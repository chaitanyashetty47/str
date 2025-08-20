// Logo.tsx
"use client"
import React from 'react';
import Image from 'next/image';
import indiaFluxIcon from "@/components/icons/indiaflux.jpg";
import indiaScoopIcon from "@/components/icons/indiascoop.png";
import bestofhindustan from "@/components/icons/bestofhindustan.jpg"



interface LogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  href: string;
}

export const Logo = ({ src, alt, width = 48, height = 48, href }:LogoProps) => (
  <a 
    href={href}
    target="_blank"      // Opens in new tab
    rel="noopener noreferrer"  // Security best practice
    className="hover:opacity-80 transition-opacity"  // Optional: adds hover effect
  >
  <Image src={src} alt={alt} width={width} height={height} className="h-12 w-auto" />
  </a>
);

export default function Featured() {
  return (
    <div className="container mx-auto px-4 py-10 items-center">
      <h2 className="font-semibold text-4xl mb-6 text-center text-purple-600">
        Also Featured In
      </h2>
      <div className="flex flex-row space-x-9 justify-center">
        <Logo src={indiaFluxIcon.src} alt="Logo 1" width={400} height={15} href ="https://indianflux.com/aditya-mandan-the-para-powerlifter-and-founder-of-stentor/" />
        <Logo src={indiaScoopIcon.src} alt="Logo 2" width={500} height={48} href = "https://medium.com/@digitalscoopindia/aditya-mandan-the-para-powerlifter-and-founder-of-stentor-778f2bd995e1"/>
        <Logo src={indiaFluxIcon.src} alt="Logo 3" width={600} height={100} href = "https://bestofhindustan.com/aditya-mandan-the-para-powerlifter-and-founder-of-stentor/"/>
      </div>
    </div>
  );
}