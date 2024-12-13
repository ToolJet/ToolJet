import React, { useContext } from 'react';
import cx from 'classnames';
import { GlobalDataSourcesContext } from '..';
import { DataSourceTypes } from '../../Editor/DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { decodeEntities } from '@/_helpers/utils';

export const ListItem = ({
  dataSource,
  key,
  active,
  onDelete,
  updateSelectedDatasource,
  toolTipText,
  disableDelButton = false,
}) => {
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
      getSvgIcon(sourceMeta?.kind?.toLowerCase(), 24, 22, dataSource?.plugin?.iconFile?.data)
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
  const showDeleteButton = !isSampleDb;

  return (
    <ToolTip
      placement="right"
      show={toolTipText ? true : false}
      message={'Sample data source\ncannot be deleted'}
      tooltipClassName="tooltip-sampl-db"
    >
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
          <div className="ds-svg-container">{icon}</div>

          <div className="font-400 tj-text-xsm text-truncate" style={{ paddingLeft: '6px', display: 'flex' }}>
            {decodeEntities(dataSource.name)}
            {isSampleDb && (
              <div
                className="font-400 tj-text-xxsm text-truncate"
                style={{ paddingTop: '3px', paddingLeft: '2px', color: '#687076' }}
              >{`(postgres)`}</div>
            )}
          </div>
        </div>
        {showDeleteButton && (
          <div className="col-auto">
            {}
            <button
              title={'Delete'}
              disabled={disableDelButton}
              className="ds-delete-btn"
              onClick={() => onDelete(dataSource)}
              data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-delete-button`}
            >
              <div>
                <SolidIcon
                  width="14"
                  height="14"
                  name="delete"
                  fill={disableDelButton ? '#E6E8EB' : '#E54D2E'}
                  className={disableDelButton ? 'disabled-button' : ''}
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </ToolTip>
  );
};
