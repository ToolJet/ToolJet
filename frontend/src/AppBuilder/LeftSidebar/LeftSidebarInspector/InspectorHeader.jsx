import React from 'react';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import InputComponent from '@/components/ui/Input/Index';

const InspectorHeader = ({ darkMode, onClose, searchValue, onSearchChange, onSearchClear }) => {
  return (
    <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
      <div className="inspector-header-top">
        <span className="inspector-header-title">Inspector</span>
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
    </div>
  );
};

export default InspectorHeader;
