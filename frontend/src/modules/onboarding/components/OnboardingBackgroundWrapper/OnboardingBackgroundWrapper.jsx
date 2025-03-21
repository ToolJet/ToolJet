import React from 'react';
import './resources/styles/background.styles.scss';
import { defaultWhiteLabellingSettings, retrieveWhiteLabelFavicon } from '@white-label/whiteLabelling';
import WhiteLabellingBackgroundWrapper from '@/modules/onboarding/components/WhiteLabellingBackgroundWrapper';
const OnboardingBackgroundWrapper = ({
  LeftSideComponent,
  RightSideComponent,
  MiddleComponent,
  rightSize = 7,
  leftSize = 5,
}) => {
  const whiteLabelLogo = retrieveWhiteLabelFavicon();
  const defaultWhiteLabelLogo = defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON;
  const isWhiteLabelLogoApplied = !(whiteLabelLogo === defaultWhiteLabelLogo);
  if (window.location.pathname != '/setup' && isWhiteLabelLogoApplied) {
    const ContentComponent = MiddleComponent ? MiddleComponent : LeftSideComponent;
    return <WhiteLabellingBackgroundWrapper MiddleComponent={() => <ContentComponent />} />;
  }
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
