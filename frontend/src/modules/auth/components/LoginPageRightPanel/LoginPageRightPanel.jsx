import React from 'react';
import { useWhiteLabellingStore, useWhiteLabelBanner } from '@/_stores/whiteLabellingStore';
import { GeneralFeatureImage } from '@/modules/common/components';

const LoginPageRightPanel = () => {
  const isDefaultWhiteLabel = useWhiteLabellingStore((state) => state.isDefaultWhiteLabel);
  const isWhiteLabelDetailsFetched = useWhiteLabellingStore((state) => state.isWhiteLabelDetailsFetched);
  const whiteLabelBanner = useWhiteLabelBanner();

  if (!isWhiteLabelDetailsFetched) return null;

  if (isDefaultWhiteLabel) return <GeneralFeatureImage />;

  if (!whiteLabelBanner) return null;

  return (
    <img
      src={whiteLabelBanner}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
};

export default LoginPageRightPanel;
