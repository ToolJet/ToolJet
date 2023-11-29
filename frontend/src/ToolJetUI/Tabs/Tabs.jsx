import React from 'react';
import BootstrapTabs from 'react-bootstrap/Tabs';
import cx from 'classnames';
import './tabs.scss';

const Tabs = ({ darkMode, defaultActiveKey, id, className, children, ...restProps }) => {
  return (
    <div className="tj-tabs">
      <BootstrapTabs
        defaultActiveKey={defaultActiveKey}
        id={id}
        className={cx(className, {
          'theme-dark dark-theme': darkMode,
        })}
        justify
        {...restProps}
      >
        {children}
      </BootstrapTabs>
    </div>
  );
};

export default Tabs;
