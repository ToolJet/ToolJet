import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import cx from 'classnames';

const GlobalSettingsHeader = ({ darkMode, onClose }) => {
  return (
    <div className={cx('global-settings-header', { 'dark-theme': darkMode })}>
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
