import React, { useState } from 'react';

function DataSourceLister({ dataSources, staticDataSources, changeDataSource }) {
  console.log('data incoming', dataSources, staticDataSources, changeDataSource);
  const [allSources] = useState([...dataSources, ...staticDataSources]);

  const check = (item) => {
    console.log('item is', item);
    changeDataSource(item.id);
  };
  return (
    <div>
      {allSources.map((item, index) => {
        return (
          <div className="card" key={index} onClick={() => check(item)}>
            {item.name}
          </div>
        );
      })}
    </div>
  );
}

export default DataSourceLister;
