import React from 'react';
import cx from 'classnames';
import { Sidebar } from '../Sidebar';

export const GlobalDataSourcesPage = ({ darkMode }) => {
  return (
    <div className="row gx-0">
      <Sidebar />
      <div
        className={cx('col animation-fade', {
          'bg-light-gray': !darkMode,
        })}
      ></div>
    </div>
  );
};
