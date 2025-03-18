import React from 'react';
import StepLight from './light-mode/step2.svg';
import StepDark from './dark-mode/step2.svg';

const Step2 = ({ darkMode }) => {
  const Component = darkMode ? StepDark : StepLight;
  return <Component />;
};

export default Step2;
