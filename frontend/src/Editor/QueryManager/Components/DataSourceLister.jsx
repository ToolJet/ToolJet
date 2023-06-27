import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunpyIcon from '@/Editor/Icons/runpy.svg';
import AddIcon from '@assets/images/icons/add-source.svg';
import { useTranslation } from 'react-i18next';
import { getSvgIcon } from '@/_helpers/appUtils';
import { groupBy } from 'lodash';
import DataSourceIcon from './DataSourceIcon';

function DataSourceLister({
  dataSources,
  staticDataSources,
  globalDataSources,
  changeDataSource,
  handleBackButton,
  darkMode,
  dataSourceModalHandler,
  showAddDatasourceBtn = true,
  dataSourceBtnComponent = null,
}) {
  const [allSources, setAllSources] = useState([...dataSources, ...staticDataSources]);
  const [globalDataSourcesOpts, setGlobalDataSourcesOpts] = useState([]);
  const { t } = useTranslation();
  const computedStyles = {
    background: darkMode ? '#2f3c4c' : 'white',
    color: darkMode ? 'white' : '#1f2936',
    border: darkMode && '1px solid #2f3c4c',
  };
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
    { label: <span className="text-muted">Defaults</span>, isDisabled: true },
    ...allSources.map((source) => ({
      label: (
        <div>
          <DataSourceIcon source={source} /> {source.name}
        </div>
      ),
      value: source.id,
      source,
    })),
    { label: <span className="text-muted">Global datasources</span>, isDisabled: true },
    ...globalDataSourcesOpts,
  ];

  return (
    <div className="query-datasource-card-container">
      {showAddDatasourceBtn && dataSourceBtnComponent && dataSourceBtnComponent}

      <Select
        onChange={({ source } = {}) => handleChangeDataSource(source)}
        styles={{
          control: (style) => ({ ...style, width: '400px' }),
          groupHeading: (style) => ({
            ...style,
            fontSize: '100%',
            textTransform: '',
            color: 'inherit',
            fontWeight: '400',
          }),
          option: (style, { data: { isNested } }) => ({
            ...style,
            ...(isNested
              ? { paddingLeft: '20px', marginLeft: '40px', borderLeft: '1px solid #ccc', width: 'auto' }
              : {}),
          }),
        }}
        placeholder="Where do you want to connect to"
        options={DataSourceOptions}
        menuIsOpen
      />
    </div>
  );
}

export default DataSourceLister;
