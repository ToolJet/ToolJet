import React, { useState, useEffect } from 'react';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunpyIcon from '@/Editor/Icons/runpy.svg';
import AddIcon from '@assets/images/icons/add-source.svg';
import { useTranslation } from 'react-i18next';
import { getSvgIcon } from '@/_helpers/appUtils';
import Beta from '@/_ui/Beta';
import SolidIcon from '@/_ui/Icon/SolidIcons';

function DataSourceLister({
  dataSources,
  staticDataSources,
  changeDataSource,
  handleBackButton,
  darkMode,
  dataSourceModalHandler,
  showAddDatasourceBtn = true,
  dataSourceBtnComponent = null,
}) {
  const [allSources, setAllSources] = useState([...dataSources, ...staticDataSources]);
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
      case 'workflows':
        return <SolidIcon name="workflows" fill="rgb(61,99,220)" width="20" />;
      default:
        return <Icon />;
    }
  };

  return (
    <div className="query-datasource-card-container">
      {showAddDatasourceBtn && dataSourceBtnComponent && dataSourceBtnComponent}
      {allSources.map((source) => {
        return (
          <div
            className="query-datasource-card"
            style={computedStyles}
            key={`${source.id}-${source.kind}`}
            onClick={() => {
              handleChangeDataSource(source);
            }}
          >
            {fetchIconForSource(source)}
            <p data-cy={`${String(source.name).toLocaleLowerCase().replace(/\s+/g, '-')}-add-query-card`}>
              {' '}
              {source.name}
            </p>
            {source.kind === 'workflows' && (
              <Beta
                style={{
                  fontSize: '12px',
                  width: '46px',
                  height: '24px',
                }}
              />
            )}
          </div>
        );
      })}
      {showAddDatasourceBtn && !dataSourceBtnComponent && (
        <div className="query-datasource-card" style={computedStyles} onClick={dataSourceModalHandler}>
          <AddIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />
          <p>{t('editor.queryManager.addDatasource', 'Add datasource')}</p>
        </div>
      )}
    </div>
  );
}

export default DataSourceLister;
