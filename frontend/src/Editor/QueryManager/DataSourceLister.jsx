import React, { useState } from 'react';
import { allSvgs } from '@tooljet/plugins/client';

function DataSourceLister({ dataSources, staticDataSources, changeDataSource }) {
  const [allSources] = useState([...dataSources, ...staticDataSources]);

  const handleChangeDataSource = (item) => {
    changeDataSource(item.id);
  };
  return (
    <div className="query-datasource-card-container">
      {allSources.map((item, index) => {
        const Icon = allSvgs[item.kind];

        return (
          <div className="query-datasource-card" key={index} onClick={() => handleChangeDataSource(item)}>
            {Icon && <Icon style={{ height: 25, width: 25 }} />}
            <p> {item.name}</p>
          </div>
        );
      })}
    </div>
  );
}

export default DataSourceLister;
