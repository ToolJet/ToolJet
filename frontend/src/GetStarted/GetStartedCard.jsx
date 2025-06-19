import React from 'react';

export default function GetStartedCard({ children, className = '', ...props }) {
  return (
    <div
      className={`card !tw-bg-page-weak tw-box-border !tw-border-border-weak tw-border-solid tw-content-stretch tw-flex tw-flex-row tw-gap-2.5 tw-items-start tw-justify-start tw-p-[12px] tw-relative tw-w-72 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
