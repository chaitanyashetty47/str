import React from 'react';
import Image from 'next/image';

interface IntroCardProps {
  icon: 'holistic' | 'inclusivity' | 'empowerment' | 'community';
  title: string;
  description: string;
}

const iconPaths: Record<IntroCardProps['icon'], string> = {
  holistic: '/icons/holistic.png',
  inclusivity: '/icons/inclusitivity.png',
  empowerment: '/icons/confidence.png',
  community: '/icons/community.png',
};

const colorMap: Record<IntroCardProps['icon'], string> = {
  holistic: '#F31818',    // Strentor Red
  inclusivity: '#00D115', // Strentor Green
  empowerment: '#FFBD22', // Strentor Orange
  community: '#0D97FF',   // Strentor Blue
};

export function IntroCard({ icon, title, description }: IntroCardProps) {
  const iconPath = iconPaths[icon];
  const iconColor = colorMap[icon];

  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-700 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
      <div 
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <div className="relative h-8 w-8">
          <Image
            src={iconPath}
            alt={`${title} Icon`}
            fill
            sizes="32px"
            className="object-contain"
          />
        </div>
      </div>
      <div className="space-y-2">
        <h3 
          className="text-xl font-bold"
          style={{ color: iconColor }}
        >
          {title}
        </h3>
        <p className="text-lg font-semibold text-gray-900">
          {description}
        </p>
      </div>
    </div>
  );
}

export default IntroCard;