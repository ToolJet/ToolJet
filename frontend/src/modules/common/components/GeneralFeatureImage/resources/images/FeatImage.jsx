import React from 'react';
import MainImage from './MainImage';
import MainImageDark from './MainImageDark';

const FeatImage = () => {
  // New Images are used.
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return darkMode ? <MainImageDark /> : <MainImage />;
};

export default FeatImage;
