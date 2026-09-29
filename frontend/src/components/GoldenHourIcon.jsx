import React from 'react';

export default function GoldenHourIcon({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Heart gradient: crimson to golden amber */}
        <linearGradient id="gh-heart-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E11D48" />
          <stop offset="55%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Golden ring gradient */}
        <linearGradient id="gh-gold-ring" x1="25" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="gh-glow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded squircle background for app icon container */}
      <rect width="100" height="100" rx="22" fill="url(#gh-heart-grad)" />

      {/* Subtle inner soft overlay */}
      <rect width="100" height="100" rx="22" fill="black" opacity="0.08" />

      {/* Outer Heart Silhouette with soft shadow */}
      <path
        d="M50 82C50 82 22 64 16 44C11.5 29 22.5 18 35.5 18C42.5 18 47.5 22 50 25.5C52.5 22 57.5 18 64.5 18C77.5 18 88.5 29 84 44C78 64 50 82 50 82Z"
        fill="white"
        opacity="0.16"
      />

      {/* Golden Clock Dial inside Heart (The Golden Hour) */}
      <circle
        cx="50"
        cy="47"
        r="23"
        stroke="url(#gh-gold-ring)"
        strokeWidth="3.5"
        strokeDasharray="145"
        strokeDashoffset="24"
        strokeLinecap="round"
        fill="rgba(15, 23, 42, 0.28)"
      />

      {/* Clock hour marks (12, 3, 6, 9) */}
      <line x1="50" y1="28" x2="50" y2="31" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="69" y1="47" x2="66" y2="47" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="66" x2="50" y2="63" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="31" y1="47" x2="34" y2="47" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Clock hands: pointing to urgent golden countdown (11:55 / high stakes) */}
      <line x1="50" y1="47" x2="50" y2="35" stroke="#FFFFFF" strokeWidth="2.75" strokeLinecap="round" />
      <line x1="50" y1="47" x2="60" y2="42" stroke="#FDE68A" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="50" cy="47" r="3" fill="#FDE68A" />

      {/* Beating ECG lifeline passing across the clock */}
      <path
        d="M20 54H33L37 49L42 61L48 37L54 57L58 51L63 54H80"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gh-glow)"
      />
    </svg>
  );
}
