import React, { useState } from 'react';
import './BasicPlanMigrationBanner.scss';
import CloseIcon from '@/_ui/Icon/bulkIcons/CloseIcon';

export const BasicPlanMigrationBanner = ({ closeBanner, darkMode }) => {
  return (
    <div className={`${darkMode ? 'theme-dark dark-theme' : ''} basic-plan-migration-banner`}>
      <div style={{ marginLeft: 'auto' }}>
        <p className="banner-text">
          We will be updating our pricing plan for our AI features on.
          <span className="banner-link">21st September ‘25</span> To know more{' '}
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
