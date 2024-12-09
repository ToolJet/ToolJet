import React from 'react';
import { Alert } from '@/_ui/Alert/Alert';
import './resources/styles.scss';

const DEFAULT_CONFIG = {
  docsLink: ' https://docs.tooljet.com/docs/data-sources/local-data-sources-migration',
};

const DEFAULT_MESSAGES = {
  prefix: 'This query is connected to a local data source which has been',
  highlightedText: 'discontinued',
  middle: 'Please create a global data source connection to reconnect your query.',
  suffix: 'to know more.',
  linkText: 'Read documentation',
};

const NotificationBanner = ({
  docsLink,
  customMessage,
  darkMode = false,
  highlightedText = DEFAULT_MESSAGES.highlightedText,
  highlightedClassName = 'highlighted-text',
  enhanceDisabledVisibility = false,
}) => {
  const currentDocsLink = docsLink || DEFAULT_CONFIG.docsLink;

  const bannerMessage = customMessage || (
    <>
      {DEFAULT_MESSAGES.prefix} <span className={highlightedClassName}>{highlightedText}</span>.{' '}
      {DEFAULT_MESSAGES.middle}{' '}
      <a href={currentDocsLink} className="documentation-link" target="_blank" rel="noopener noreferrer">
        {DEFAULT_MESSAGES.linkText}
      </a>{' '}
      {DEFAULT_MESSAGES.suffix}
    </>
  );

  return (
    <div className="notification-banner-component">
      <Alert svg="info-icon" cls="notification-banner" useDarkMode={darkMode}>
        <div className={`notification-content ${enhanceDisabledVisibility ? 'disabled' : ''}`}>{bannerMessage}</div>
      </Alert>
    </div>
  );
};

export default NotificationBanner;

// To Do later:  Expand this component properly to make it generic notification component
