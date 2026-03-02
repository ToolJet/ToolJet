import React from 'react';
import GradientBottom from './gradient-bottom.svg';

const GradientBottomImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return darkMode ? <GradientBottom /> : <GradientBottom />;
};

export default GradientBottomImage;
