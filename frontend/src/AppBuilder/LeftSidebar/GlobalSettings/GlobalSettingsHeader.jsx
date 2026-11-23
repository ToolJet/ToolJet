import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import cx from 'classnames';

const GlobalSettingsHeader = ({ darkMode, onClose, onBackToSearch }) => {
  return (
    <div className={cx('global-settings-header', { 'dark-theme': darkMode })}>
      {onBackToSearch && (
        <Button
          iconOnly
          leadingIcon="arrow-left"
          onClick={onBackToSearch}
          variant="ghost"
          size="medium"
          isLucid={true}
          aria-label="Back to search"
          title="Back to search"
          data-cy="global-settings-back-to-search"
        />
      )}
      <span className="global-settings-header-title">Global settings</span>
      <Button
        iconOnly
        leadingIcon="x"
        onClick={onClose}
        variant="ghost"
        size="medium"
        isLucid={true}
        data-cy="global-settings-close-button"
      />
    </div>
  );
};

export default GlobalSettingsHeader;
