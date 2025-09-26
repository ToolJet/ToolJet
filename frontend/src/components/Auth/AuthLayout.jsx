import React from 'react';
import FeatureList from './FeatureList';

export const AuthLayout = ({ children }) => {
  return (
    <div className="tw-grid tw-min-h-svh lg:tw-grid-cols-[38%_1fr] tw-bg-background-surface-layer-01">
      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-6 md:tw-p-10">
        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
          <div className="tw-w-full tw-max-w-xs">{children}</div>
        </div>
      </div>
      <div className="tw-bg-muted tw-relative tw-hidden lg:tw-block tw-h-full tw-w-full tw-p-4">
        <div className="tw-h-full tw-w-full tw-rounded-2xl tw-object-cover tw-bg-[linear-gradient(90deg,hsla(176,61%,87%,1)_0%,hsla(150,54%,86%,1)_50%,hsla(301,68%,84%,1)_100%)] tw-flex tw-items-center tw-justify-center tw-p-8">
          <FeatureList />
        </div>
      </div>
    </div>
  );
};
