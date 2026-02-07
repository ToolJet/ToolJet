import React from 'react';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';
import { useTranslation } from 'react-i18next';

const InspectorHeader = ({ darkMode, onClose, searchValue, onSearchChange, onSearchClear, hideSearch = false }) => {
  const { t } = useTranslation();
  return (
    <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
      <div className="inspector-header-top">
        <span className="inspector-header-title">{t('editor.leftSidebar.inspector', 'Inspector')}</span>
        <ButtonComponent
          iconOnly
          leadingIcon="x"
          onClick={onClose}
          variant="ghost"
          size="medium"
          isLucid={true}
          data-cy="inspector-close-button"
        />
      </div>
      {!hideSearch && (
        <div className="inspector-header-search">
          <InputComponent
            leadingIcon="search01"
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onSearchClear}
            size="medium"
            placeholder={t('globals.search', 'Search')}
            value={searchValue}
            {...(searchValue && { trailingAction: 'clear' })}
            data-cy="inspector-search-input"
          />
        </div>
      )}
    </div>
  );
};

export default InspectorHeader;
