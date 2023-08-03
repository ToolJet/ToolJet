import React from 'react';
import cx from 'classnames';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';

export const SegregatedList = ({ dataSources, activeDatasourceList, handleOnSelect }) => {
  const { handleActions } = useGlobalDatasourceUnsavedChanges();
  return (
    <>
      <div className="datasources-info tj-text-xsm datasource-list-header">
        All datasources {dataSources[0].list.length > 0 && `(${dataSources[0].list.length})`}
      </div>
      {dataSources.slice(1, 5).map((dataSource, index) => (
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
