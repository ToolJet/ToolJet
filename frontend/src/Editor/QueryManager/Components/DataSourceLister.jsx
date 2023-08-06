import React, { useState, useEffect } from 'react';
import RunjsIcon from '@/Editor/Icons/runjs.svg';
import RunTooljetDbIcon from '@/Editor/Icons/tooljetdb.svg';
import RunpyIcon from '@/Editor/Icons/runpy.svg';
import AddIcon from '@assets/images/icons/add-source.svg';
import { useTranslation } from 'react-i18next';
import { getSvgIcon } from '@/_helpers/appUtils';
import { ToolTip } from '@/_components/ToolTip';

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
            <ToolTip message={source.name}>
              <p data-cy={`${String(source.name).toLocaleLowerCase().replace(/\s+/g, '-')}-add-query-card`}>
                {' '}
                {source.name}
              </p>
            </ToolTip> 
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
