import React, { useContext, useEffect } from 'react';
import cx from 'classnames';
import { GlobalDataSourcesContext } from '..';
import { DataSourceTypes } from '../../Editor/DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import DeleteIcon from '../Icons/DeleteIcon.svg';

export const ListItem = ({ dataSource, key, active, onDelete, updateSidebarNAV }) => {
  const { setSelectedDataSource, toggleDataSourceManagerModal } = useContext(GlobalDataSourcesContext);

  const getSourceMetaData = (dataSource) => {
    if (dataSource.plugin_id) {
      return dataSource.plugin?.manifest_file?.data.source;
    }

    return DataSourceTypes.find((source) => source.kind === dataSource.kind);
  };

  const sourceMeta = getSourceMetaData(dataSource);
  const icon = getSvgIcon(sourceMeta.kind.toLowerCase(), 24, 24, dataSource?.plugin?.icon_file?.data);

  const focusModal = () => {
    const element = document.getElementsByClassName('form-control-plaintext form-control-plaintext-sm')[0];
    element.focus();
  };
  useEffect(() => {
    if (active) updateSidebarNAV(dataSource?.name);
    else if (dataSource?.lenght == 0) updateSidebarNAV('');
  }, []);

  return (
    <div
      key={key}
      className={cx('tj-text-sm mx-3 p-2 rounded-3 mb-2 datasources-list', {
        'datasources-list-item': active,
      })}
    >
      <div
        role="button"
        onClick={() => {
          setSelectedDataSource(dataSource);
          toggleDataSourceManagerModal(true);
          focusModal();
          updateSidebarNAV(dataSource?.name);
        }}
        className="col d-flex align-items-center"
      >
        {icon}
        <span className="font-400" style={{ paddingLeft: 5 }}>
          {dataSource.name}
        </span>
      </div>
      <div className="col-auto">
        <button className="btn btn-sm ds-delete-btn" onClick={() => onDelete(dataSource)}>
          <div>
            <DeleteIcon width="14" height="14" />
          </div>
        </button>
      </div>
    </div>
  );
};
