import React from 'react';
import './BasicPlanMigrationBanner.scss';
import CloseIcon from '@/_ui/Icon/bulkIcons/CloseIcon';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Play } from 'lucide-react';

export const BasicPlanMigrationBanner = ({ closeBanner, darkMode }) => {
  return (
    <div className={`${darkMode ? 'theme-dark dark-theme' : ''} basic-plan-migration-banner`}>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="banner-icon">
          <SolidIcon name="tooljetai" width={24} height={24} className="" data-name="TJ AI" aria-label="ToolJet AI" />
          <span className="banner-special-text">New</span>
        </div>
        <p className="banner-text">
          From sticky notes and Slack threads, watch how our <span className="banner-link-date">AI app builder</span>{' '}
          turns ideas into full-stack apps instantly
        </p>
        <div
          className="banner-video"
          type="button"
          onClick={() => window.open('https://youtu.be/ejSQSUv0lHQ', '_blank')}
        >
          <Play fill={'var(--icon-default)'} stroke="none" />
          <span className="banner-video-text">Watch</span>
        </div>
      </div>
      <div onClick={closeBanner} type="button">
        <CloseIcon width="12" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
      </div>
    </div>
  );
};
