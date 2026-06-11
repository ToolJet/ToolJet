import React from 'react';
import { ReleaseVersionButton, PromoteVersionButton } from './components';
import useStore from '@/AppBuilder/_stores/store';

const BasePromoteReleaseButton = ({ showPromoteBtn }) => {
  const getCanPromoteAndRelease = useStore((state) => state.getCanPromoteAndRelease);
  const { canPromote, canRelease } = getCanPromoteAndRelease();
  return (
    <div className="nav-item dropdown promote-release-btn">
      {canPromote && showPromoteBtn && <PromoteVersionButton />}
      {(canRelease || !showPromoteBtn) && <ReleaseVersionButton />}
    </div>
  );
};

export default BasePromoteReleaseButton;
