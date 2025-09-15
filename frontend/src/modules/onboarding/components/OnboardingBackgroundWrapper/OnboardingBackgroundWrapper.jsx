import React from 'react';
import './resources/styles/background.styles.scss';
import { defaultWhiteLabellingSettings } from '@white-label/whiteLabelling';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { GalleryVerticalEnd } from 'lucide-react';

import { LoginForm } from '@/components/login-form';
import WhiteLabellingBackgroundWrapper from '@/modules/onboarding/components/WhiteLabellingBackgroundWrapper';
const OnboardingBackgroundWrapper = ({
  LeftSideComponent,
  RightSideComponent,
  MiddleComponent,
  rightSize = 7,
  leftSize = 5,
}) => {
  const whiteLabelFavIcon = useWhiteLabellingStore((state) => state.whiteLabelFavicon);
  const isWhiteLabelLogoApplied = whiteLabelFavIcon !== defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON;
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const currentRoute = pathSegments[pathSegments.length - 1];
  if (currentRoute !== 'setup' && isWhiteLabelLogoApplied) {
    const ContentComponent = MiddleComponent ? MiddleComponent : LeftSideComponent;
    return <WhiteLabellingBackgroundWrapper MiddleComponent={() => <ContentComponent />} />;
  }
  return (
    <div className="tw-grid tw-min-h-svh lg:tw-grid-cols-2">
      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-6 md:tw-p-10">
        <div className="tw-flex tw-justify-center tw-gap-2 md:tw-justify-start">
          <a href="#" className="tw-flex tw-items-center tw-gap-2 tw-font-medium">
            <div className="tw-bg-primary tw-text-primary-foreground tw-flex tw-size-6 tw-items-center tw-justify-center tw-rounded-md">
              <GalleryVerticalEnd className="tw-size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
          <div className="tw-w-full tw-max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="tw-bg-muted tw-relative tw-hidden lg:tw-block">
        <RightSideComponent />
      </div>
    </div>
  );
};

export default OnboardingBackgroundWrapper;