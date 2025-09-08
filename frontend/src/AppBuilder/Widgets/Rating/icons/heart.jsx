import React from 'react';

export default ({ fill = '#EE5B67', unselected = null, isHalf = false, gradientId = null }) => {
  // Generate unique gradient ID if half-fill is requested
  const uniqueGradientId = gradientId || `heartGradient-${Math.random().toString(36).substr(2, 9)}`;

  // Determine the fill value
  const fillValue = isHalf && unselected ? `url(#${uniqueGradientId})` : fill;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill={fillValue}
      className="show-opacity-on-hover"
    >
      {isHalf && unselected && (
        <defs>
          <linearGradient id={uniqueGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor={fill} />
            <stop offset="50%" stopColor={unselected} />
          </linearGradient>
        </defs>
      )}
      <path
        d="M5.72457 1.44221C6.99834 1.54579 8.30233 2.23897 9.56028 3.63856C10.8196 2.24293 12.1269 1.55407 13.4037 1.45314C14.8478 1.33921 16.1067 1.98363 16.9751 2.85719C18.8216 4.71383 19.3706 8.61311 17.2043 11.0905L17.1877 11.1063L10.4732 18.4098C10.1994 18.6348 9.79798 18.6348 9.52413 18.4098L2.80961 11.1063C2.80239 11.0996 2.79534 11.0926 2.78846 11.0854C0.566124 8.59949 1.12065 4.70019 2.95043 2.84351C3.81518 1.96937 5.06945 1.32523 5.72457 1.44221Z"
        fill={fillValue}
      />
    </svg>
  );
};
