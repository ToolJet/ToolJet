import React from 'react';
import FeatImage from './resources/images/FeatImage';
import Slogan from './resources/images/slogan.svg';
import './resources/styles/general-feature-image.styles.scss';

const GeneralFeatureImage = () => {
  return (
    <div className="general-feature-image">
      <div className="content-wrapper">
        <div className="image-wrapper">
          <FeatImage />
        </div>
        <div className="slogan-wrapper">
          <Slogan />
        </div>
      </div>
    </div>
  );
};

export default GeneralFeatureImage;
