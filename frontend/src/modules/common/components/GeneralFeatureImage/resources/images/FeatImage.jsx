import React from 'react';
import FeatImageDark from './main-dark.svg';
import Feat from './main.svg';

const FeatImage = () => {
  // New Images are used.
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return darkMode ? <FeatImageDark /> : <Feat />;
};

export default FeatImage;
