import React from 'react';
import StepLight from './light-mode/step2.svg?url';
import StepDark from './dark-mode/step2.svg?url';

const Step2 = ({ darkMode }) => {
  const Component = darkMode ? StepDark : StepLight;
  return <img src={Component} alt="Step 2" />;
};

export default Step2;
