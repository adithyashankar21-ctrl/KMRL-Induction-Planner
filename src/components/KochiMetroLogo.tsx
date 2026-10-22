import React from 'react';

interface KochiMetroLogoProps {
  className?: string;
  height?: number | string;
}

export const KochiMetroLogo: React.FC<KochiMetroLogoProps> = ({ className = '', height = 32 }) => {
  return (
    <svg
      height={height}
      viewBox="0 0 220 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      style={{ aspectRatio: '220/110' }}
    >
      {/* Lime Green Ribbon Segment (M-shape) */}
      <path
        d="M 52 62 L 76 84 C 79 87 85 87 88 84 L 128 44 L 148 22 C 152 18 158 18 162 22 L 202 62"
        stroke="#badd28"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Teal Ribbon Segment (K-shape) */}
      <path
        d="M 22 84 L 22 26 C 22 20 22 20 22 20 L 78 72 L 126 22 C 130 18 136 18 140 22 L 148 30"
        stroke="#00b5b5"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
