import React from 'react';

export default ({ fill = '#EFB82D', unselected = null, isHalf = false }) => {
  // Generate unique gradient ID if half-fill is requested
  const uniqueGradientId = `starGradient-${Math.random().toString(36).substr(2, 9)}`;

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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.99966 0.3125C10.1747 0.312388 10.3462 0.361268 10.4949 0.453609C10.6436 0.54595 10.7634 0.678065 10.8409 0.835L13.1934 5.60375L18.4559 6.36875C18.629 6.39389 18.7915 6.46694 18.9253 6.57965C19.059 6.69235 19.1585 6.84022 19.2127 7.00654C19.2668 7.17286 19.2733 7.351 19.2314 7.52081C19.1895 7.69062 19.101 7.84535 18.9759 7.9675L15.1684 11.68L16.0672 16.92C16.0968 17.0924 16.0777 17.2696 16.0118 17.4317C15.9459 17.5939 15.836 17.7342 15.6945 17.8371C15.553 17.94 15.3855 18.0012 15.211 18.0139C15.0365 18.0265 14.862 17.9901 14.7072 17.9087L9.99966 15.4337L5.29216 17.9087C5.13739 17.99 4.96299 18.0264 4.78865 18.0137C4.6143 18.0011 4.44696 17.94 4.30551 17.8374C4.16406 17.7346 4.05415 17.5944 3.98817 17.4325C3.9222 17.2706 3.9028 17.0936 3.93216 16.9212L4.83216 11.6787L1.02216 7.9675C0.896614 7.8454 0.807781 7.69059 0.765721 7.52059C0.723662 7.35059 0.730058 7.17221 0.784187 7.00566C0.838316 6.83911 0.938011 6.69105 1.07198 6.57826C1.20594 6.46547 1.36882 6.39246 1.54216 6.3675L6.80466 5.60375L9.15841 0.835C9.23589 0.678065 9.35574 0.54595 9.50441 0.453609C9.65309 0.361268 9.82464 0.312388 9.99966 0.3125Z"
        fill={fillValue}
      />
    </svg>
  );
};
