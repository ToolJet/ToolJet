import React from 'react';
import Feat from './feat-image.svg';
import GradientBottom from './gradient-bottom.svg';

const GradientBottomImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return darkMode ? <GradientBottom /> : <GradientBottom />;
};

export default GradientBottomImage;
