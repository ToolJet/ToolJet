import React from 'react';
import { useWhiteLabellingStore, useWhiteLabelBanner } from '@/_stores/whiteLabellingStore';
import { GeneralFeatureImage } from '@/modules/common/components';

const LoginPageRightPanel = () => {
  const isWhiteLabelDetailsFetched = useWhiteLabellingStore((state) => state.isWhiteLabelDetailsFetched);
  const whiteLabelBanner = useWhiteLabelBanner();

  if (!isWhiteLabelDetailsFetched) return null;

  if (!whiteLabelBanner) return <GeneralFeatureImage />;

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

export default LoginPageRightPanel;
