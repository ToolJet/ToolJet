import React from 'react';

function LegacyBanner({ className }) {
  return (
    <span className={`legacy-banner ${className || ''}`}>
      Lgcy
    </span>
  );
}

export default LegacyBanner;