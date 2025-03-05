import React from 'react';
import Feat from './feat-image.svg';
import GradientTop from './gradient-top.svg';

const GradientTopImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return darkMode ? <GradientTop /> : <GradientTop />;
};

export default GradientTopImage;
