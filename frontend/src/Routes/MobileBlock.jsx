import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import LogoLight from '@assets/images/logo-light.svg';
import LogoDark from '@assets/images/logo-dark.svg';

// Mobile Empty State Component - simple and reusable
export const MobileEmptyState = ({ darkMode = false }) => {
  return (
    <div className={`tw-h-screen ${darkMode ? 'dark-theme' : ''} tw-bg-background-surface-layer-01`}>
      {/* Fixed Header */}
      <div className="tw-fixed tw-top-0 tw-left-0 tw-right-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-w-full tw-p-6 tw-bg-background-surface-layer-01 tw-border-b tw-border-solid tw-border-border-weak tw-border-t-0 tw-border-l-0 tw-border-r-0">
        <div className="tw-flex tw-items-center">
          {darkMode ? (
            <LogoDark className="tw-h-5" alt="ToolJet logo" data-cy="page-logo" />
          ) : (
            <LogoLight className="tw-h-5" alt="ToolJet logo" data-cy="page-logo" />
          )}
        </div>
      </div>

      {/* Main Content - Centered between header and footer */}
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-px-6 tw-text-center tw-max-w-md tw-mx-auto">
        {/* Desktop Mockup Icon */}
        <div className="tw-mb-8">
          <SolidIcon
            name={darkMode ? 'mobile-empty-state-dark' : 'mobile-empty-state'}
            width="200"
            height="140"
            fill="var(--icon-strong)"
          />
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

      {/* Fixed Footer */}
      <div className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-z-10 tw-w-full tw-p-6 tw-bg-background-surface-layer-01 tw-border-t tw-border-solid tw-border-border-weak tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-text-center">
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
