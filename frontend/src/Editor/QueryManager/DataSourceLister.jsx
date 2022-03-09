import React, { useState } from 'react';
import { allSvgs } from '@tooljet/plugins/client';
import RunjsIcon from '../Icons/runjs.svg';

function DataSourceLister({ dataSources, staticDataSources, changeDataSource, handleBackButton }) {
  const [allSources] = useState([...dataSources, ...staticDataSources]);

  const handleChangeDataSource = (item) => {
    changeDataSource(item.id);
    handleBackButton();
  };
  return (
    <div className="query-datasource-card-container">
      {allSources.map((item) => {
        const Icon = allSvgs[item.kind];
        return (
          <div className="query-datasource-card" key={item.id} onClick={() => handleChangeDataSource(item)}>
            {item.kind === 'runjs' ? (
              <RunjsIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />
            ) : (
              Icon && <Icon style={{ height: 25, width: 25 }} />
            )}
            <p> {item.name}</p>
          </div>
        );
      })}
    </div>
  );
}

export default DataSourceLister;
