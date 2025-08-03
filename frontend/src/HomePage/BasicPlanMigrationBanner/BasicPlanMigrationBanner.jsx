import React, { useState } from 'react';
import './BasicPlanMigrationBanner.scss';
import CloseIcon from '@/_ui/Icon/bulkIcons/CloseIcon';

export const BasicPlanMigrationBanner = ({ closeBanner, darkMode }) => {
  return (
    <div className={`${darkMode ? 'theme-dark dark-theme' : ''} basic-plan-migration-banner`}>
      <div style={{ marginLeft: 'auto' }}>
        <p className="banner-text">
          We&apos;ve updated your plan limits to align with our{' '}
          <a href="https://www.tooljet.ai/pricing" className="banner-link" target="_blank" rel="noopener noreferrer">
            new pricing.
          </a>{' '}
          For help in retrieving data or any inquiries,{' '}
          <a
            href="https://docs.tooljet.ai/docs/tj-setup/licensing/self-hosted/"
            className="banner-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            read docs
          </a>{' '}
          or{' '}
          <a href="mailto:hello@tooljet.com" className="banner-link" target="_blank" rel="noopener noreferrer">
            contact us
          </a>
        </p>
      </div>
      <div onClick={closeBanner} type="button">
        <CloseIcon width="12" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
      </div>
    </div>
  );
};
