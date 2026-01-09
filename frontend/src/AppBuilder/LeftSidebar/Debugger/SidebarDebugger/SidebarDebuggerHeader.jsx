import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import cx from 'classnames';
import './debuggerHeader.scss';

const DebuggerTab = ({ label, isActive, onClick }) => {
  return (
    <div
      className={cx('debugger-tab', { active: isActive })}
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
    >
      <div className="debugger-tab-content">
        <span className="debugger-tab-label">{label}</span>
      </div>
    </div>
  );
};

export const SidebarDebuggerHeader = ({ darkMode, onClear, onClose, activeTab, onTabChange }) => {
  return (
    <div className={cx('debugger-header', { 'dark-theme': darkMode })}>
      <div className="debugger-header-top">
        <span className="debugger-header-title">Debugger</span>
        <div className="debugger-header-actions">
          <Button
            iconOnly
            leadingIcon="trash"
            onClick={onClear}
            variant="ghost"
            size="medium"
            isLucid={true}
            data-cy="debugger-clear-button"
          />
          <Button
            iconOnly
            leadingIcon="x"
            onClick={onClose}
            variant="ghost"
            size="medium"
            isLucid={true}
            data-cy="debugger-close-button"
          />
        </div>
      </div>
      <div className="debugger-tabs-container" role="tablist">
        <DebuggerTab
          label="All logs"
          isActive={activeTab === 'allLog'}
          onClick={() => onTabChange('allLog')}
        />
        <DebuggerTab
          label="Errors"
          isActive={activeTab === 'errors'}
          onClick={() => onTabChange('errors')}
        />
      </div>
    </div>
  );
};

export default SidebarDebuggerHeader;
