import React from 'react';
import PanelIconButton from '@/AppBuilder/Shared/Panel/PanelIconButton';
import PanelCloseButton from '@/AppBuilder/Shared/Panel/PanelCloseButton';
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
          <PanelIconButton
            label="Clear logs"
            leadingIcon="trash"
            onClick={onClear}
            size="medium"
            isLucid
            data-cy="debugger-clear-button"
          />
          <PanelCloseButton label="Close debugger" onClose={onClose} dataCy="debugger-close-button" />
        </div>
      </div>
      <div className="debugger-tabs-container" role="tablist">
        <DebuggerTab label="All logs" isActive={activeTab === 'allLog'} onClick={() => onTabChange('allLog')} />
        <DebuggerTab label="Errors" isActive={activeTab === 'errors'} onClick={() => onTabChange('errors')} />
      </div>
    </div>
  );
};

export default SidebarDebuggerHeader;
