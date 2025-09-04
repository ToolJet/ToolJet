import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';

// Mobile Empty State Component - simple and reusable
export const MobileEmptyState = ({ darkMode = false }) => {
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-between tw-h-screen tw-bg-background-surface-layer-01">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-p-6 tw-border-b tw-border-solid tw-border-border-weak">
        <div className="tw-flex tw-items-center">
          <LogoLightMode height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
        </div>
      </div>

      {/* Main Content */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-6 tw-text-center tw-max-w-md tw-mx-auto">
        {/* Desktop Mockup Icon */}
        <div className="tw-mb-8">
          <SolidIcon name="mobile-empty-state" width="200" height="140" fill="var(--icon-strong)" />
        </div>

        {/* Title */}
        <h1 className="tw-text-[20px] tw-leading-10 tw-font-medium tw-mb-0 tw-text-text-default">
          Desktop access only
        </h1>

        {/* Description */}
        <p className="tw-text-xl tw-leading-6 tw-mb-6 tw-text-text-default">
          ToolJet’s builder mode is available on desktop only. Please switch to a computer or laptop to use our
          platform.
        </p>
      </div>

      {/* Footer */}
      <div className="tw-w-full tw-p-6 tw-border-t tw-border-solid tw-border-border-weak tw-text-center">
        <p className="tw-text-sm tw-text-text-placeholder tw-mb-0">
          Need help? Contact our support team at{' '}
          <a
            href="mailto:support@tooljet.com"
            className="tw-underline hover:tw-no-underline tw-text-text-brand hover:tw-text-text-brand-hover"
          >
            support@tooljet.com
          </a>
        </p>
      </div>
    </div>
  );
};
