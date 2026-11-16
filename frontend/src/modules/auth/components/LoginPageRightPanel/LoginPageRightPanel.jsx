import React from 'react';
import { useWhiteLabellingStore, useWhiteLabelBanner } from '@/_stores/whiteLabellingStore';
import { GeneralFeatureImage } from '@/modules/common/components';
import SignupFeatureImage from '@/modules/common/components/SignupFeatureImage';

const LoginPageRightPanel = ({ DefaultImage = GeneralFeatureImage }) => {
  const isWhiteLabelDetailsFetched = useWhiteLabellingStore((state) => state.isWhiteLabelDetailsFetched);
  const whiteLabelBanner = useWhiteLabelBanner();

  if (!isWhiteLabelDetailsFetched) return null;

  if (!whiteLabelBanner) return <DefaultImage />;

  return (
    <img
      src={whiteLabelBanner}
      className={'general-feature-image'}
      alt=""
      style={{ objectFit: 'cover', display: 'block' }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

// Right panel for the sign up, sign in and workspace invite pages; pair with the
// `feature-graphic-layout` className on OnboardingBackgroundWrapper
export const FeatureGraphicRightPanel = () => <LoginPageRightPanel DefaultImage={SignupFeatureImage} />;

export default LoginPageRightPanel;
