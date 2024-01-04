import React from 'react';
import cx from 'classnames';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';

export const SegregatedList = ({ dataSources, activeDatasourceList, handleOnSelect }) => {
  const { handleActions } = useGlobalDatasourceUnsavedChanges();
  const totalDataSources = dataSources.reduce((acc, filteredGroup) => [...acc, ...filteredGroup.list], []).length;
  return (
    <>
      <div className="datasources-info tj-text-xsm datasource-list-header" data-cy="datasource-list-header">
        All data sources {totalDataSources > 0 && `(${totalDataSources})`}
      </div>
      {dataSources
        .filter((ds) => ds.list.length > 0 || ds.type === 'Plugins')
        .map((dataSource, index) => (
          <div
            key={index}
            className={cx('mx-3 rounded-3 datasources-list', {
              'datasources-list-item': activeDatasourceList === dataSource.key,
            })}
          >
            <div
              role="button"
              onClick={() => handleActions(() => handleOnSelect(dataSource.key, dataSource.type))}
              className="col d-flex align-items-center overflow-hidden"
              data-cy={`${dataSource.key
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '')}-datasource-button`}
            >
              <div className="font-400 tj-text-xsm text-truncate" style={{ paddingLeft: '6px' }}>
                {`${dataSource.type} (${dataSource.list.length})`}
              </div>
            </div>
          </div>
        ))}
    </>
  );
};
