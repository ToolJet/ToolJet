import React, { useState, Children, isValidElement } from 'react';
import cx from 'classnames';
import './tabs.scss';

// Custom Tabs component - replaces Bootstrap Tabs for full styling control
const Tabs = ({
  darkMode,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  id,
  className,
  children,
  closeIcon,
  onSelect,
  hidden,
  ...restProps
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey);

  // Support both controlled and uncontrolled modes
  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey;

  const handleTabClick = (eventKey) => {
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(eventKey);
    }
    if (onSelect) {
      onSelect(eventKey);
    }
  };

  // Extract Tab children
  const tabs = Children.toArray(children).filter(isValidElement);

  if (hidden) {
    return null;
  }

  return (
    <div className={cx('tj-tabs', className, { 'theme-dark dark-theme': darkMode })} id={id} {...restProps}>
      {closeIcon && closeIcon()}
      {/* Tab Navigation */}
      <div className="nav-tabs" role="tablist">
        {tabs.map((tab) => {
          const { eventKey, title, disabled } = tab.props;
          const isActive = activeKey === eventKey;

          return (
            <div key={eventKey} className="nav-item">
              <button
                type="button"
                role="tab"
                className={cx('nav-link', { active: isActive, disabled })}
                onClick={() => !disabled && handleTabClick(eventKey)}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                disabled={disabled}
              >
                <span className="tab-label">{title}</span>
              </button>
            </div>
          );
        })}
      </div>
      {/* Tab Content */}
      <div className="tab-content">
        {tabs.map((tab) => {
          const { eventKey, children: tabContent, className: tabClassName } = tab.props;
          const isActive = activeKey === eventKey;

          return (
            <div
              key={eventKey}
              role="tabpanel"
              className={cx('tab-pane', tabClassName, { active: isActive })}
              style={{ display: isActive ? 'block' : 'none' }}
            >
              {tabContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
