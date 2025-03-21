import React from 'react';
import Feat from './feat-image.svg';
import FeatImageDark from './feat-image-dark.svg';

const FeatImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return darkMode ? <FeatImageDark /> : <Feat />;
};

export default FeatImage;
