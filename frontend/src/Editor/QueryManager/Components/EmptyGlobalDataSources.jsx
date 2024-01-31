import React from 'react';
import InfoIcon from '@assets/images/icons/info.svg';
import AddGlobalDataSourceButton from './AddGlobalDataSourceButton';

const EmptyGlobalDataSources = ({ darkMode }) => {
  return (
    <div className={`empty-gds-container ${darkMode && 'theme-dark'}`}>
      <div className="info-container">
        <div className="icon-container">
          <InfoIcon />
        </div>
        <div className="info">
          No Data sources have been added.
          <br />
          Add a new Data source to connect to your app.
        </div>
      </div>
      <AddGlobalDataSourceButton />
    </div>
  );
};

export default EmptyGlobalDataSources;
