import React from 'react';
import { Link } from 'react-router-dom';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import LogoLight from '@assets/images/logo-light.svg';
import LogoDark from '@assets/images/logo-dark.svg';
import { Button } from '@/components/ui/Button/Button';

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
        <div className="tw-mb-3">
          <SolidIcon
            name={darkMode ? 'mobile-empty-state-dark' : 'mobile-empty-state'}
            width="200"
            height="140"
            fill="var(--icon-strong)"
          />
        </div>

        {/* Title */}
        <h1 className="tw-font-title-x-large tw-mb-0 tw-text-text-default">Desktop access only</h1>

        {/* Description */}
        <p className="tw-font-body-large tw-text-text-placeholder">
          ToolJet’s builder mode is available on desktop only. Please switch to a computer or laptop to use our
          platform.
        </p>

        <Button
          isLucid
          size="large"
          variant="ghostBrand"
          leadingIcon="arrow-left"
          className="tw-w-full hover:tw-no-underline active:tw-no-underline"
          to="/"
          component={Link}
        >
          Back to dashboard
        </Button>
      </div>

      {/* Fixed Footer */}
      <div className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-z-10 tw-w-full tw-p-6 tw-bg-background-surface-layer-01 tw-text-center">
        <p className="tw-font-body-large tw-text-text-placeholder tw-mb-0">
          Need help? Contact our support team at
          <br />
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
