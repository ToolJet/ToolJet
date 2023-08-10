import React from 'react';
import BootstrapTab from 'react-bootstrap/Tab';
import cx from 'classnames';
import './tabs.scss';

const Tabs = ({ darkMode, eventKey, title, className, children, ...restProps }) => {
  return (
    <BootstrapTab
      eventKey={eventKey}
      title={title}
      className={cx(className, {
        'theme-dark dark-theme': darkMode,
      })}
      {...restProps}
    >
      {children}
    </BootstrapTab>
  );
};

export default Tabs;
