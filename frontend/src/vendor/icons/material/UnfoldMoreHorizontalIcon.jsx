import React from 'react';

// Minimal fallback for @icons/material/UnfoldMoreHorizontalIcon
// Renders a simple horizontal unfold icon using currentColor
export default function UnfoldMoreHorizontalIcon({ size = 16, color = 'currentColor', ...props }) {
  const s = Number(size) || 16;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Left chevron */}
      <path d="M10.5 7L6 12l4.5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right chevron */}
      <path d="M13.5 17L18 12l-4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
