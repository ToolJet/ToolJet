import React from 'react';
import BootstrapTabs from 'react-bootstrap/Tabs';
import cx from 'classnames';
import './tabs.scss';

const Tabs = ({ darkMode, defaultActiveKey, id, className, children, ...restProps }) => {
  return (
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
  );
};

export default Tabs;
