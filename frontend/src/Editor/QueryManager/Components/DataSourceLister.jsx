import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunpyIcon from '@/Editor/Icons/runpy.svg';
import AddIcon from '@assets/images/icons/add-source.svg';
import { useTranslation } from 'react-i18next';
import { getSvgIcon } from '@/_helpers/appUtils';
import { groupBy } from 'lodash';

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
            {fetchIconForSource(sources?.[0])} {kind}
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

  const fetchIconForSource = (source) => {
    const iconFile = source?.plugin?.iconFile?.data ?? undefined;
    const Icon = () => getSvgIcon(source.kind, 20, 20, iconFile);

    switch (source.kind) {
      case 'runjs':
        return <RunjsIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />;
      case 'runpy':
        return <RunpyIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />;
      case 'tooljetdb':
        return <RunTooljetDbIcon />;
      default:
        return <Icon />;
    }
  };

  const DataSourceOptions = [
    { label: <span className="text-muted">Defaults</span>, isDisabled: true },
    ...allSources.map((source) => ({
      label: (
        <div>
          {fetchIconForSource(source)} {source.name}
        </div>
      ),
      value: source.id,
      source,
    })),
    { label: <span className="text-muted">Global datasources</span>, isDisabled: true },
    ...globalDataSourcesOpts,
  ];

  console.log('globalDataSources >>>>>>>>>>', globalDataSources);

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
            ...(isNested ? { paddingLeft: '20px', marginLeft: '40px', borderLeft: '1px solid #ccc' } : {}),
          }),
        }}
        placeholder="Where do you want to connect to"
        options={DataSourceOptions}
      />
    </div>
  );
}

export default DataSourceLister;
