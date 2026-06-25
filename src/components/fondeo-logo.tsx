import React from 'react';

interface FondeoLogoProps {
  className?: string;
  size?: number;
}

export function FondeoLogo({ className = '', size = 32 }: FondeoLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#059669" />
        <path
          d="M20 28V16M20 16L14 22M20 16L26 22"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 30H27"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
      <span
        className="font-bold text-gray-900 dark:text-white tracking-tight"
        style={{ fontSize: size * 0.6, lineHeight: 1 }}
      >
        Fondeo
      </span>
    </div>
  );
}
