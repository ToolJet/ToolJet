import React from 'react';

function LegacyBanner({ className }) {
  return (
    <span className={`legacy-banner ${className || ''}`}>
      Legacy
    </span>
  );
}

export default LegacyBanner;