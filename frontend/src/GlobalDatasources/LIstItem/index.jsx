import React, { useContext } from 'react';
import cx from 'classnames';
import { GlobalDataSourcesContext } from '..';
import { DataSourceTypes } from '../../Editor/DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';

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
    dataSource.type === DATA_SOURCE_TYPE.SAMPLE ? (
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

  const isSampleDb = dataSource.type == DATA_SOURCE_TYPE.SAMPLE;

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
          {isSampleDb && (
            <div
              className="font-400 tj-text-xxsm text-truncate"
              style={{ paddingTop: '3px', paddingLeft: '2px', color: '#687076' }}
            >{`(postgres)`}</div>
          )}
        </div>
      </div>
      <div className="col-auto">
        <ToolTip
          placement="right"
          show={isSampleDb}
          message={'Sample data source\ncannot be deleted'}
          tooltipClassName="tooltip-sampl-db"
        >
          <button
            disabled={isSampleDb}
            className="ds-delete-btn"
            onClick={() => onDelete(dataSource)}
            title={isSampleDb ? 'Sample data source\ncannot be deleted' : 'Delete'}
            data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-delete-button`}
          >
            <div>
              <SolidIcon
                width="14"
                height="14"
                name="delete"
                fill={isSampleDb ? '#E6E8EB' : '#E54D2E'}
                className={isSampleDb ? 'disabled-button' : ''}
              />
            </div>
          </button>
        </ToolTip>
      </div>
    </div>
  );
};
