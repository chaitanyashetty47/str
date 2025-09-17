import React from 'react';

interface IconProps {
  className?: string;
}

export const BMIIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Scale/Balance representation */}
    <path d="M12 2v20" />
    <path d="M8 6h8" />
    <path d="M6 8l6-2 6 2" />
    <path d="M6 16l6 2 6-2" />
    <circle cx="8" cy="10" r="2" />
    <circle cx="16" cy="10" r="2" />
    <path d="M8 12v4" />
    <path d="M16 12v4" />
  </svg>
);

export const BMRIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Heartbeat/Metabolism representation */}
    <path d="M3 12h4l3-9 4 18 3-9h4" />
    <circle cx="7" cy="12" r="1" />
    <circle cx="17" cy="12" r="1" />
    <path d="M7 8v8" />
    <path d="M17 8v8" />
  </svg>
);

export const BodyFatIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Target/Bullseye representation */}
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
  </svg>
);

export const IdealWeightIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Weight scale with trending line */}
    <path d="M3 20h18" />
    <path d="M6 20v-4" />
    <path d="M18 20v-4" />
    <path d="M6 16h12" />
    <path d="M12 16v-8" />
    <path d="M8 8l4-4 4 4" />
    <path d="M4 12h16" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

export const LeanBodyMassIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Muscle/Strength representation */}
    <path d="M12 2l3 3-3 3-3-3z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
    <path d="M6 16l6 4 6-4" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <path d="M9 10v4" />
    <path d="M15 10v4" />
  </svg>
);

export const MacroSplitIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Pie chart/Nutrition split representation */}
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 2a10 10 0 0 1 7.07 2.93" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 9v6" />
    <path d="M9 12h6" />
  </svg>
);