import React from 'react';

const WorkflowsIllustration = ({ className = '', width = '24', height = '24', fill: _fill = 'currentColor' }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 207"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_110_9061)">
        <rect width="300" height="207" rx="16" fill="var(--illu-surface)" />
        <rect width="300" height="193" rx="16" fill="var(--illu-card)" />
        <circle cx="20.499" cy="20.4993" r="4.5" fill="var(--illu-dot)" />
        <circle cx="33.499" cy="20.4993" r="4.5" fill="var(--illu-dot)" />
        <circle cx="46.499" cy="20.4993" r="4.5" fill="var(--illu-dot)" />
        <rect x="15.4915" y="32.7043" width="268" height="146" rx="4" fill="var(--illu-surface)" />
        <rect
          x="29.9659"
          y="97.0955"
          width="56.3323"
          height="14.0831"
          rx="2.11246"
          fill="var(--illu-card)"
          stroke="var(--illu-accent)"
          strokeWidth="1.40831"
        />
        <path d="M91.1892 104.137H108.089" stroke="var(--illu-accent)" strokeWidth="0.704154" strokeLinecap="round" />
        <circle cx="111.591" cy="104.137" r="0.704154" fill="var(--illu-node)" stroke="var(--illu-accent)" strokeWidth="1.40831" />
        <rect
          x="115.796"
          y="97.0958"
          width="56.3323"
          height="14.0831"
          rx="2.11246"
          fill="var(--illu-card)"
          stroke="var(--illu-accent)"
          strokeWidth="1.40831"
        />
        <path d="M178.03 100.939L206.196 76.2931" stroke="var(--illu-accent)" strokeWidth="0.704154" strokeLinecap="round" />
        <path d="M177.02 105.926L205.89 131.98" stroke="var(--illu-accent)" strokeWidth="0.704154" strokeLinecap="round" />
        <circle cx="210.42" cy="72.7735" r="0.704154" fill="var(--illu-node)" stroke="var(--illu-accent)" strokeWidth="1.40831" />
        <circle cx="209.411" cy="135.501" r="0.704154" fill="var(--illu-node)" stroke="var(--illu-accent)" strokeWidth="1.40831" />
        <rect
          x="212.533"
          y="66.1128"
          width="56.3323"
          height="14.0831"
          rx="2.11246"
          fill="var(--illu-card)"
          stroke="var(--illu-accent)"
          strokeWidth="1.40831"
        />
        <rect
          x="212.533"
          y="128.079"
          width="56.3323"
          height="14.0831"
          rx="2.11246"
          fill="var(--illu-card)"
          stroke="var(--illu-accent)"
          strokeWidth="1.40831"
        />
      </g>
      <rect
        x="0.516381"
        y="0.516381"
        width="298.967"
        height="205.967"
        rx="15.4836"
        stroke="var(--illu-accent-strong)"
        strokeWidth="1.03276"
      />
      <defs>
        <clipPath id="clip0_110_9061">
          <rect width="300" height="207" rx="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default WorkflowsIllustration;
