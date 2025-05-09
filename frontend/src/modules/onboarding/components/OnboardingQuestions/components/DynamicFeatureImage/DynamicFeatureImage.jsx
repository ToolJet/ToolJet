import React from 'react';
import { Step2 } from './resources/images';
import './resources/styles/dynamic-feature-image.styles.scss';

const DynamicFeatureImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="dynamic-feature-image" data-cy="onboarding-image">
      <Step2 darkMode={darkMode} />
    </div>
  );
};

export default DynamicFeatureImage;
