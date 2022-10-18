import React, { useState, useEffect } from 'react';
import RunjsIcon from '../Icons/runjs.svg';
import AddIcon from '../../../assets/images/icons/add-source.svg';
import { useTranslation } from 'react-i18next';
import { getSvgIcon } from '@/_helpers/appUtils';

function DataSourceLister({
  dataSources,
  staticDataSources,
  changeDataSource,
  handleBackButton,
  darkMode,
  dataSourceModalHandler,
}) {
  const [allSources, setAllSources] = useState([...dataSources, ...staticDataSources]);
  const { t } = useTranslation();
  const computedStyles = {
    background: darkMode ? '#2f3c4c' : 'white',
    color: darkMode ? 'white' : '#1f2936',
    border: darkMode && '1px solid #2f3c4c',
  };
  const handleChangeDataSource = (item) => {
    changeDataSource(item.id);
    handleBackButton();
  };

  useEffect(() => {
    setAllSources([...dataSources, ...staticDataSources]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources]);

  return (
    <div className="query-datasource-card-container">
      {allSources.map((item) => {
        const iconFile = item?.plugin?.icon_file?.data ?? undefined;
        const Icon = () => getSvgIcon(item.kind, 25, 25, iconFile);
        return (
          <div
            className="query-datasource-card"
            style={computedStyles}
            key={item.id}
            onClick={() => handleChangeDataSource(item)}
          >
            {item.kind === 'runjs' ? <RunjsIcon style={{ height: 25, width: 25, marginTop: '-3px' }} /> : <Icon />}
            <p data-cy={`${String(item.name).toLocaleLowerCase().replace(/\s+/g, '-')}-add-query-card`}> {item.name}</p>
          </div>
        );
      })}
      <div className="query-datasource-card" style={computedStyles} onClick={dataSourceModalHandler}>
        <AddIcon style={{ height: 25, width: 25, marginTop: '-3px' }} />
        <p>{t('editor.queryManager.addDatasource', 'Add datasource')}</p>
      </div>
    </div>
  );
}

export default DataSourceLister;
