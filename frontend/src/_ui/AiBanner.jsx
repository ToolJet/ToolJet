import React from 'react';
function AiBanner({ className }) {
  return (
    <div className={`d-flex ai-tag ${className}`}>
      <img src="assets/images/icons/ai-tag.svg" alt="AI Tag" />
      <p className="ee-gradient-text">AI</p>
    </div>
  );
}

export default AiBanner;
