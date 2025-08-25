import React from 'react';
import BootstrapTabs from 'react-bootstrap/Tabs';
import cx from 'classnames';
import './tabs.scss';

const Tabs = ({ darkMode, defaultActiveKey, id, className, children, closeIcon, onSelect, ...restProps }) => {
  return (
    <div className="tj-tabs">
      {closeIcon && closeIcon()}
      <BootstrapTabs
        defaultActiveKey={defaultActiveKey}
        id={id}
        className={cx(className, {
          'theme-dark dark-theme': darkMode,
        })}
        justify
        onSelect={onSelect}
        {...restProps}
      >
        {children}
      </BootstrapTabs>
    </div>
  );
};

export default Tabs;
