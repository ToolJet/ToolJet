import React from 'react';
import usePopover from '../../_hooks/use-popover';
import { LeftSidebarItem } from './SidebarItem';
import { DataSourceManager } from '../DataSourceManager';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Tooltip from 'react-bootstrap/esm/Tooltip';

export const LeftSidebarDataSources = ({ appId, darkMode, dataSources = [], dataSourcesChanged }) => {
  const [open, trigger, content] = usePopover(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = React.useState(false);
  const [selectedDataSource, setSelectedDataSource] = React.useState(null);

  const renderDataSource = (dataSource, idx) => {
    const sourceMeta = DataSourceTypes.find((source) => source.kind === dataSource.kind);
    return (
      <div className="row py-1" key={idx}>
        <div className="col">
          <img
            className="svg-icon"
            src={`/assets/images/icons/editor/datasources/${sourceMeta.kind.toLowerCase()}.svg`}
            width="20"
            height="20"
          />
          <span className="p-2 font-500">{dataSource.name}</span>
        </div>
      </div>
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
        <LeftSidebarDataSources.Container
          renderDataSource={renderDataSource}
          dataSources={dataSources}
          toggleDataSourceManagerModal={toggleDataSourceManagerModal}
        />
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
        selectedDataSource={selectedDataSource}
      />
    </>
  );
};

const LeftSidebarDataSourcesContainer = ({ renderDataSource, dataSources = [], toggleDataSourceManagerModal }) => {
  if (dataSources.length === 0) {
    return (
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
    );
  }
  return (
    <div className="card-body">
      <div>
        <div className="row">
          <div className="col-10">
            <span className="font-500">Data sources</span>
          </div>
          <div className="col-2">
            <OverlayTrigger
              trigger={['hover', 'focus']}
              placement="top"
              delay={{ show: 800, hide: 100 }}
              overlay={<Tooltip id="button-tooltip">{'Add datasource'}</Tooltip>}
            >
              <span onClick={() => toggleDataSourceManagerModal(true)} className="cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="#4D72FA"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>
              </span>
            </OverlayTrigger>
          </div>
        </div>
        <div className="d-flex">
          <div className="mt-2">{dataSources?.map((source, idx) => renderDataSource(source, idx))}</div>
        </div>
      </div>
    </div>
  );
};

LeftSidebarDataSources.Container = LeftSidebarDataSourcesContainer;
