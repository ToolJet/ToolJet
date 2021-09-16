import React from 'react';
import usePopover from '../../_hooks/use-popover';
import { LeftSidebarItem } from './sidebar-item';
import { DataSourceManager } from '../DataSourceManager';
import { DataSourceTypes } from '../DataSourceManager/DataSourceTypes';

export const LeftSidebarDataSources = ({ appId, darkMode, dataSources = [], dataSourcesChanged }) => {
  const [open, trigger, content] = usePopover(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = React.useState(false);
  const [selectedDataSource, setSelectedDataSource] = React.useState(null);

  const renderDataSource = (dataSource, idx) => {
    const sourceMeta = DataSourceTypes.find((source) => source.kind === dataSource.kind);
    return (
      <tr
        role="button"
        key={idx}
        onClick={() => {
          setSelectedDataSource(dataSource);
          toggleDataSourceManagerModal(true);
        }}
      >
        <td>
          <img
            src={`/assets/images/icons/editor/datasources/${sourceMeta.kind.toLowerCase()}.svg`}
            width="20"
            height="20"
          />{' '}
          {dataSource.name}
        </td>
      </tr>
    );
  };

  return (
    <>
      <LeftSidebarItem
        tip="Add or edit datasources"
        {...trigger}
        icon="database"
        className={`left-sidebar-item ${open && 'active'}`}
      />
      <div {...content} className={`card popover datasources-popover ${open ? 'show' : 'hide'}`}>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-vcenter table-nowrap">
              <tbody>{dataSources?.map((source, idx) => renderDataSource(source, idx))}</tbody>
            </table>
            {dataSources?.length === 0 && (
              <center className="p-2 text-muted">
                You haven&apos;t added any datasources yet. <br />
              </center>
            )}
            <center>
              <button onClick={() => toggleDataSourceManagerModal(true)} className="btn btn-sm btn-outline-azure mt-3">
                Add datasource
              </button>
            </center>
          </div>
        </div>
      </div>
      <DataSourceManager
        appId={appId}
        showDataSourceManagerModal={showDataSourceManagerModal}
        darkMode={darkMode}
        hideModal={() => {
          setSelectedDataSource(null);
          toggleDataSourceManagerModal(false);
        }}
        dataSourcesChanged={dataSourcesChanged}
        showDataSourceManagerModal={showDataSourceManagerModal}
        selectedDataSource={selectedDataSource}
      />
    </>
  );
};
