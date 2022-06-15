import React, { useState } from 'react';
import { allSvgs } from '@tooljet/plugins/client';
import RunjsIcon from '../Icons/runjs.svg';
import AddIcon from '../../../assets/images/icons/add-source.svg';

function DataSourceLister({
  dataSources,
  staticDataSources,
  changeDataSource,
  handleBackButton,
  darkMode,
  dataSourceModalHandler,
}) {
  const [allSources] = useState([...dataSources, ...staticDataSources]);

  const computedStyles = {
    background: darkMode ? '#2f3c4c' : 'white',
    color: darkMode ? 'white' : '#1f2936',
    border: darkMode && '1px solid #2f3c4c',
  };
  const handleChangeDataSource = (item) => {
    changeDataSource(item.id);
    handleBackButton();
  };
  return (
    <div className="query-datasource-card-container">
      {allSources.map((item) => {
        const Icon = allSvgs[item.kind];
        return (
          <div
            className="query-datasource-card"
            style={computedStyles}
            key={item.id}
            onClick={() => handleChangeDataSource(item)}
          >
            {item.kind === 'runjs' ? (
              <RunjsIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />
            ) : (
              Icon && <Icon style={{ height: 25, width: 25 }} />
            )}
            <p> {item.name}</p>
          </div>
        );
      })}
      <div className="query-datasource-card" style={computedStyles} onClick={dataSourceModalHandler}>
        <AddIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />
        <p> Add datasource</p>
      </div>
    </div>
  );
}

export default DataSourceLister;
