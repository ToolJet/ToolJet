import React from 'react';
import { getPanelCloseLabel, SIDEBAR_ITEMS } from '@/AppBuilder/panelLayout';
import { Button } from '@/components/ui/Button/Button';
import cx from 'classnames';
import PanelHeader from '@/AppBuilder/Shared/Panel/PanelHeader';

const GlobalSettingsHeader = ({ darkMode, onClose, onBackToSearch }) => {
  return (
    <PanelHeader
      title={SIDEBAR_ITEMS.settings.name}
      onClose={onClose}
      closeLabel={getPanelCloseLabel('settings')}
      closeDataCy="global-settings-close-button"
      className={cx('global-settings-header', { 'dark-theme': darkMode })}
      titleClassName="global-settings-header-title"
      leading={
        onBackToSearch && (
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
        )
      }
    />
  );
};

export default GlobalSettingsHeader;
