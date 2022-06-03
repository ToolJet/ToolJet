import React, { useEffect, useState } from 'react';

export const Steps = function Button({ height, properties, styles, fireEvent, setExposedVariable }) {
  const { values, labels, label, defaultSelected, multiSelection } = properties;
  const { color, theme, visibility, disabledState } = styles;

  return (
    <div className="steps">
      <a href="#" className="step-item">
        Step 1
      </a>
      <a href="#" className="step-item">
        Step 2
      </a>
      <a href="#" className="step-item active">
        Step 3
      </a>
      <span href="#" className="step-item">
        Step 4
      </span>
    </div>
  );
};
