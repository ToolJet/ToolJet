import React, { useContext } from 'react';
import cx from 'classnames';
import { GlobalDataSourcesContext } from '..';
import { DataSourceTypes } from '../../Editor/DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import DeleteIcon from '../Icons/DeleteIcon.svg';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ListItem = ({ dataSource, key, active, onDelete, updateSelectedDatasource }) => {
  const {
    setSelectedDataSource,
    toggleDataSourceManagerModal,
    environments,
    setCurrentEnvironment,
    setActiveDatasourceList,
  } = useContext(GlobalDataSourcesContext);
  const { handleActions } = useGlobalDatasourceUnsavedChanges();

  const getSourceMetaData = (dataSource) => {
    if (dataSource.pluginId) {
      return dataSource.plugin?.manifestFile?.data.source;
    }

    return DataSourceTypes.find((source) => source?.kind === dataSource?.kind);
  };

  const sourceMeta = getSourceMetaData(dataSource);

  // sourceMeta would be missing on development setup when switching between branches
  // if ds is already in branch while not available in another
  const icon =
    dataSource.type === 'sample' ? (
      <SolidIcon name="tooljet" />
    ) : (
      getSvgIcon(sourceMeta?.kind?.toLowerCase(), 24, 24, dataSource?.plugin?.iconFile?.data)
    );

  const focusModal = () => {
    const element = document.getElementsByClassName('form-control-plaintext form-control-plaintext-sm')[0];
    element.focus();
  };

  const selectDataSource = () => {
    setActiveDatasourceList('');
    setSelectedDataSource(dataSource);
    setCurrentEnvironment(environments[0]);
    toggleDataSourceManagerModal(true);
    focusModal();
    updateSelectedDatasource(dataSource?.name);
  };

  return (
    <div
      key={key}
      className={cx('mx-3 rounded-3 datasources-list', {
        'datasources-list-item': active,
      })}
    >
      <div
        role="button"
        onClick={() => handleActions(selectDataSource)}
        className="col d-flex align-items-center overflow-hidden"
        data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-button`}
      >
        <div>{icon}</div>

        <div className="font-400 tj-text-xsm text-truncate" style={{ paddingLeft: '6px', display: 'flex' }}>
          {dataSource.name}
          {dataSource.type == 'sample' && (
            <div
              className="font-400 tj-text-xxsm text-truncate"
              style={{ paddingTop: '3px', paddingLeft: '2px', color: '#687076' }}
            >{`(postgres)`}</div>
          )}
        </div>
      </div>
      <div className="col-auto">
        <button
          disabled={dataSource.type == 'sample'}
          className="ds-delete-btn"
          onClick={() => onDelete(dataSource)}
          title={dataSource.type === 'sample' ? 'Sample data source\ncannot be deleted' : 'Delete'}
          data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-delete-button`}
        >
          <div>
            <SolidIcon
              width="14"
              height="14"
              name="delete"
              fill={dataSource.type == 'sample' ? '#E6E8EB' : '#E54D2E'}
              className={dataSource.type == 'sample' ? 'disabled-button' : ''}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
