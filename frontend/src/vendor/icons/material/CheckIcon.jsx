import React from 'react';

// Minimal fallback for @icons/material/CheckIcon
// Renders a simple checkmark icon using currentColor
export default function CheckIcon({ size = 16, color = 'currentColor', ...props }) {
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
      <path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
