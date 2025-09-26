import React from 'react';

export const AuthCenteredLayout = ({ children }) => {
  return (
    <div className="tw-flex tw-min-h-svh tw-w-full tw-items-center tw-justify-center tw-p-6 md:tw-p-10">
      <div className="tw-w-full tw-max-w-sm">{children}</div>
    </div>
  );
};

