import React, { useContext } from 'react';
import cx from 'classnames';
import { GlobalDataSourcesContext } from '..';
import { DataSourceTypes } from '../../Editor/DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import DeleteIcon from '../Icons/DeleteIcon.svg';

export const ListItem = ({ dataSource, key, active, onDelete, updateSelectedDatasource }) => {
  const { setSelectedDataSource, toggleDataSourceManagerModal, environments, setCurrentEnvironment } =
    useContext(GlobalDataSourcesContext);

  const getSourceMetaData = (dataSource) => {
    if (dataSource.pluginId) {
      return dataSource.plugin?.manifestFile?.data.source;
    }

    return DataSourceTypes.find((source) => source.kind === dataSource.kind);
  };

  const sourceMeta = getSourceMetaData(dataSource);
  const icon = getSvgIcon(sourceMeta.kind.toLowerCase(), 24, 24, dataSource?.plugin?.iconFile?.data);

  const focusModal = () => {
    const element = document.getElementsByClassName('form-control-plaintext form-control-plaintext-sm')[0];
    element.focus();
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
        onClick={() => {
          setSelectedDataSource(dataSource);
          setCurrentEnvironment(environments[0]);
          toggleDataSourceManagerModal(true);
          focusModal();
          updateSelectedDatasource(dataSource?.name);
        }}
        className="col d-flex align-items-center"
        data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-button`}
      >
        {icon}
        <span className="font-400 tj-text-xsm" style={{ paddingLeft: '6px' }}>
          {dataSource.name}
        </span>
      </div>
      <div className="col-auto">
        <button
          className="ds-delete-btn"
          onClick={() => onDelete(dataSource)}
          data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-delete-button`}
        >
          <div>
            <DeleteIcon width="14" height="14" />
          </div>
        </button>
      </div>
    </div>
  );
};
