import React from 'react';
import StepLight from './light-mode/step3.svg';
import StepDark from './dark-mode/step3.svg';

const Step3 = ({ darkMode }) => {
  const Component = darkMode ? <StepDark /> : <StepLight />;
  return <div className="step3">{Component}</div>;
};

export default Step3;
