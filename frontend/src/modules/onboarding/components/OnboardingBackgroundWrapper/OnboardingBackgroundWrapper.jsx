import React from 'react';
import './resources/styles/background.styles.scss';

const OnboardingBackgroundWrapper = ({
  LeftSideComponent,
  RightSideComponent,
  MiddleComponent,
  rightSize = 7,
  leftSize = 5,
}) => {
  return (
    <div className="onboarding-background-wrapper">
      <div className="container-fluid h-100">
        {MiddleComponent ? (
          <div className="row h-100">
            <div className="col-12 d-flex justify-content-center align-items-center">
              <MiddleComponent />
            </div>
          </div>
        ) : (
          <div className="row h-100">
            <div className={`col-md-${leftSize} leftside-wrapper d-flex`}>
              <LeftSideComponent />
            </div>
            <div className={`col-md-${rightSize} rightside-wrapper d-flex align-items-center justify-content-end`}>
              <RightSideComponent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingBackgroundWrapper;
