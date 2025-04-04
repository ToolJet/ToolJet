import React from 'react';
import FeatImage from './resources/images/FeatImage';
import './resources/styles/general-feature-image.styles.scss';
import GradientTopImage from './resources/images/GradientTop';
import GradientBottomImage from './resources/images/GradientBottom';

const GeneralFeatureImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div className={`general-feature-image ${darkMode ? 'dark-theme' : ''}`}>
      <div className="gradient-top">
        <GradientTopImage />
      </div>
      <div className="main-image-container" data-cy="onboarding-image">
        <FeatImage />
      </div>
      <div className="gradient-bottom">
        <GradientBottomImage />
      </div>
    </div>
  );
};

export default GeneralFeatureImage;
