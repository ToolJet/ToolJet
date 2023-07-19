import React from 'react';

const ProgressBar = ({ value, max, classes, parentStyles }) => {
  const percentage = (value / max) * 100;
  const gradientStyle = {
    background: `linear-gradient(to right, #FF5F6D 0%, #FFC371 ${percentage || 4}%)`,
    width: `${percentage || 4}%`,
  };

  return (
    <div style={{ ...parentStyles }} className={`progress-bar ${classes}`}>
      <div className="progress" style={gradientStyle}></div>
    </div>
  );
};

export { ProgressBar };
