import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export const CircularProgressBar = function CircularProgressBar({ properties, styles }) {
  const { text, progress } = properties;
  const { visibility, color, strokeWidth, counterClockwise, circleRatio } = styles;

  const computedStyles = {
    display: visibility ? '' : 'none',
  };

  return (
    <div style={computedStyles}>
      <CircularProgressbar
        value={progress}
        text={text}
        styles={buildStyles({
          pathColor: color,
        })}
        strokeWidth={strokeWidth}
        counterClockwise={counterClockwise}
        circleRatio={circleRatio}
      />
    </div>
  );
};
