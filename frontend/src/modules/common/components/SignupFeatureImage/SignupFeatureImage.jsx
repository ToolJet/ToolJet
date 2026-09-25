import React from 'react';
import signupFeatImage from './resources/images/signup-feat-image.svg?url';
import signupFeatImageDark from './resources/images/signup-feat-image-dark.svg?url';
import './resources/styles/signup-feature-image.styles.scss';

const SignupFeatureImage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div className="signup-feature-image" data-cy="onboarding-image">
      <div className="signup-feature-image__frame">
        <img src={darkMode ? signupFeatImageDark : signupFeatImage} alt="ToolJet MCP, AI and governance overview" />
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <span key={corner} className={`signup-feature-image__handle signup-feature-image__handle--${corner}`} />
        ))}
      </div>
    </div>
  );
};

export default SignupFeatureImage;
