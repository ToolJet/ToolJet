import React from 'react';
import PanelCloseButton from '@/AppBuilder/Shared/Panel/PanelCloseButton';
import InputComponent from '@/components/ui/Input/Index';
import '../panelHeader.scss';

const InspectorHeader = ({ darkMode, onClose, searchValue, onSearchChange, onSearchClear, hideSearch = false }) => {
  return (
    <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
      <div className="inspector-header-top">
        <span className="inspector-header-title">Inspector</span>
        <PanelCloseButton label="Close inspector" onClose={onClose} dataCy="inspector-close-button" />
      </div>
      {!hideSearch && (
        <div className="inspector-header-search">
          <InputComponent
            leadingIcon="search01"
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={onSearchClear}
            size="medium"
            placeholder="Search"
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
