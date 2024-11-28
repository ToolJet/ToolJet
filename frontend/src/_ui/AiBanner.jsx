import React from 'react';
import Icon from '@/_ui/Icon/SolidIcons';
function AiBanner({ className }) {
  return (
    <div className={`d-flex tag ${className}`}>
      <Icon name="AI-tag" />
      <p className="ee-gradient-text">AI</p>
    </div>
  );
}

export default AiBanner;
