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
        <div
          role="button"
          onClick={() => {
            setSelectedDataSource(dataSource);
            toggleDataSourceManagerModal(true);
          }}
          className="col"
        >
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
  return (
    <div className="card-body">
      <div>
        <div className="row">
          <div className="col">
            <h5 className="text-muted">Data sources</h5>
          </div>
          <div className="col-auto">
            <OverlayTrigger
              trigger={['hover', 'focus']}
              placement="top"
              delay={{ show: 800, hide: 100 }}
              overlay={<Tooltip id="button-tooltip">{'Add datasource'}</Tooltip>}
            >
              <button onClick={() => toggleDataSourceManagerModal(true)} className="btn btn-sm add-btn">
                <img className="" src="/assets/images/icons/plus.svg" width="12" height="12" />
              </button>
            </OverlayTrigger>
          </div>
        </div>
        <div className="d-flex">
          {dataSources.length === 0 ? (
            <center onClick={() => toggleDataSourceManagerModal(true)} className="p-2 color-primary cursor-pointer">
              + add data source
            </center>
          ) : (
            <div className="mt-2">{dataSources?.map((source, idx) => renderDataSource(source, idx))}</div>
          )}
        </div>
      </div>
    </div>
  );
};

LeftSidebarDataSources.Container = LeftSidebarDataSourcesContainer;
