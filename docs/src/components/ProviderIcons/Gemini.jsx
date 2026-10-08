import React, { useId } from 'react';

/**
 * Google Gemini spark.
 *
 * The only provider mark that keeps its own colour in both themes — it is a radial
 * gradient, which cannot be recoloured through `currentColor` the way the monochrome
 * marks are. The gradient id is per-instance because duplicate ids in one document
 * make every copy resolve to whichever was mounted first.
 */
const Gemini = ({ size = 16, className = '' }) => {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14.6666 8.01325C12.9367 8.11941 11.3054 8.85446 10.0799 10.0799C8.85446 11.3054 8.11941 12.9367 8.01325 14.6666H7.98659C7.8806 12.9367 7.14561 11.3053 5.92009 10.0797C4.69457 8.85423 3.06315 8.11923 1.33325 8.01325L1.33325 7.98659C3.06315 7.8806 4.69457 7.14561 5.92009 5.92009C7.14561 4.69457 7.8806 3.06315 7.98659 1.33325L8.01325 1.33325C8.11941 3.06309 8.85446 4.69441 10.0799 5.91989C11.3054 7.14537 12.9367 7.88043 14.6666 7.98659V8.01325Z"
        fill={`url(#${gradientId})`}
      />

      <defs>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(2.65659 6.75242) rotate(18.6832) scale(14.1917 113.684)"
        >
          <stop offset="0.067" stopColor="#9168C0" />
          <stop offset="0.343" stopColor="#5684D1" />
          <stop offset="0.672" stopColor="#1BA1E3" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default Gemini;
