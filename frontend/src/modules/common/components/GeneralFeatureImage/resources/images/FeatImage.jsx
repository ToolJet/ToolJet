import React from 'react';
import mainImage from './mainImage.svg?url';
import mainImageDark from './mainImageDark.svg?url';

const FeatImage = () => {
  // New Images are used.
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return <img src={darkMode ? mainImageDark : mainImage} alt="Tooljet features" />;
};

export default FeatImage;
