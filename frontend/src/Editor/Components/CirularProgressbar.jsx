import React from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export const CircularProgressBar = function CircularProgressBar({ height, properties, styles }) {
  const { text, progress } = properties;
  const { visibility, color, textColor, textSize, strokeWidth, counterClockwise, circleRatio } = styles;

  const computedStyles = {
    display: visibility ? '' : 'none',
  };

  return (
    <div style={computedStyles}>
      <CircularProgressbar
        value={progress}
        text={text}
        styles={{
          root: {
            height: height,
          },
          path: {
            stroke: color,
          },
          text: {
            fill: textColor,
            fontSize: textSize,
          },
        }}
        strokeWidth={strokeWidth}
        counterClockwise={counterClockwise}
        circleRatio={circleRatio}
      />
    </div>
  );
};
