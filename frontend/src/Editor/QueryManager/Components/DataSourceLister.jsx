import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { groupBy } from 'lodash';
import DataSourceIcon from './DataSourceIcon';

function DataSourceLister({
  dataSources,
  staticDataSources,
  globalDataSources,
  changeDataSource,
  handleBackButton,
  darkMode,
}) {
  const [allSources, setAllSources] = useState([...dataSources, ...staticDataSources]);
  const [globalDataSourcesOpts, setGlobalDataSourcesOpts] = useState([]);
  const handleChangeDataSource = (source) => {
    changeDataSource(source);
    handleBackButton();
  };

  useEffect(() => {
    setAllSources([...dataSources, ...staticDataSources]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

  useEffect(() => {
    setGlobalDataSourcesOpts(
      Object.entries(groupBy(globalDataSources, 'kind')).map(([kind, sources]) => ({
        label: (
          <div>
            <DataSourceIcon source={sources?.[0]} /> {kind}
          </div>
        ),
        options: sources.map((source) => ({
          label: <div>{source.name}</div>,
          value: source.id,
          isNested: true,
          source,
        })),
      }))
    );
  }, [globalDataSources]);

  const DataSourceOptions = [
    {
      label: (
        <span className="color-slate9" style={{ fontWeight: 500 }}>
          Defaults
        </span>
      ),
      isDisabled: true,
    },
    ...allSources.map((source) => ({
      label: (
        <div>
          <DataSourceIcon source={source} /> {source.name}
        </div>
      ),
      value: source.id,
      source,
    })),
    {
      label: (
        <span className="color-slate9" style={{ fontWeight: 500 }}>
          Global datasources
        </span>
      ),
      isDisabled: true,
    },
    ...globalDataSourcesOpts,
  ];

  return (
    <div className="query-datasource-card-container">
      <Select
        onChange={({ source } = {}) => handleChangeDataSource(source)}
        styles={{
          control: (style) => ({ ...style, width: '400px', ...(darkMode ? { background: '#22272E' } : {}) }),
          menuList: (style) => ({ ...style, ...(darkMode ? { background: '#22272E' } : {}) }),
          input: (style) => ({ ...style, ...(darkMode ? { color: '#ffffff' } : {}) }),
          groupHeading: (style) => ({
            ...style,
            fontSize: '100%',
            textTransform: '',
            color: 'inherit',
            fontWeight: '400',
            ...(darkMode ? { background: '#22272E' } : {}),
          }),
          option: (style, { data: { isNested } }) => ({
            ...style,
            ...(darkMode ? { background: '#22272E' } : {}),
            ...(isNested
              ? { paddingLeft: '20px', marginLeft: '40px', borderLeft: '1px solid #ccc', width: 'auto' }
              : {}),
          }),
        }}
        placeholder="Where do you want to connect to"
        options={DataSourceOptions}
      />
    </div>
  );
}

export default DataSourceLister;
