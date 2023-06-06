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
          No global datasource have been added.
          <br />
          add new datasource to connect it to your app
        </div>
      </div>
      <AddGlobalDataSourceButton />
    </div>
  );
};

export default EmptyGlobalDataSources;
