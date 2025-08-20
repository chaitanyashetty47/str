"use client"
import React from 'react';
import Image from 'next/image';

interface LogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  href: string;
}

export const Logo = ({ src, alt, width = 48, height = 48, href }: LogoProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="hover:opacity-80 transition-opacity"
  >
    <Image src={src} alt={alt} width={width} height={height} className="h-24 w-auto" />
  </a>
);

export default function Featured() {
  return (
    <div className="container mx-auto px-4 mt-12  items-center">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6 text-center text-[#F31818]">
        Also Featured In
      </h2>
      <div className="flex flex-row space-x-9 justify-center">
     
        <Logo 
          src="/zeebiz.jpg" 
          alt="Zee Business" 
          width={300} 
          height={300} 
          href="https://youtu.be/yNR2nag2bxY?si=nKXvHjeBSn7vK1Ve"
        />
        <Logo 
          src="/dailyhunt1.jpg" 
          alt="DailyHunt" 
          width={100} 
          height={300} 
          href="https://m.dailyhunt.in/news/india/english/r+news+india-epaper-dhfacc36dfce9c4bb68db0e89d033c921b/strentor+the+space+where+your+mind+body+soul+finally+sync+up-newsid-dhfacc36dfce9c4bb68db0e89d033c921b_a3f1cd10314611f0bd7e4ef0a55aa118?sm=Y"
        />
        <Logo 
          src="/startupstory1.jpg" 
          alt="The Startup Story" 
          width={300}   
          height={300} 
          href="https://thestartupstory.co.in/index.php/2025/04/23/strentor-a-new-era-of-holistic-coaching-and-wellness"
        />
        <Logo 
          src="/gameroom.jpg" 
          alt="Game Room" 
          width={600} 
          height={600} 
          href="https://youtu.be/jIjfj5b9kLU?si=IHWL4so_xWoH1z7l"
        />
        <Logo 
          src="/udaan.jpg" 
          alt="Radio Udaan" 
          width={600} 
          height={600} 
          href="https://youtu.be/O0rwgzslQy0?si=WAvS4lkze0-KanjW"
        />
        <Logo 
          src="/joshtalks.png" 
          alt="Josh Talks" 
          width={600} 
          height={600} 
          href="https://youtu.be/29PHD0uHhDY?si=AOEL30jDkwWrjnZe"
        />
      </div>
    </div>
  );
}