/* eslint-disable import/no-named-as-default */
import React from 'react';
import { LeftSidebarItem } from './SidebarItem';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import { DataSourceManager } from '../DataSourceManager';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import { datasourceService, globalDatasourceService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Popover from '@/_ui/Popover';
import { Popover as PopoverBS, OverlayTrigger } from 'react-bootstrap';
// eslint-disable-next-line import/no-unresolved
import TrashIcon from '@assets/images/icons/query-trash-icon.svg';
import VerticalIcon from '@assets/images/icons/vertical-menu.svg';

export const LeftSidebarDataSources = ({
  appId,
  editingVersionId,
  selectedSidebarItem,
  setSelectedSidebarItem,
  darkMode,
  dataSources = [],
  globalDataSources = [],
  dataSourcesChanged,
  globalDataSourcesChanged,
  dataQueriesChanged,
  toggleDataSourceManagerModal,
  showDataSourceManagerModal,
  popoverContentHeight,
}) => {
  const [selectedDataSource, setSelectedDataSource] = React.useState(null);
  const [isDeleteModalVisible, setDeleteModalVisibility] = React.useState(false);
  const [isDeletingDatasource, setDeletingDatasource] = React.useState(false);
  const [isConversionVisible, setConversionVisible] = React.useState(false);

  const deleteDataSource = (selectedSource) => {
    setSelectedDataSource(selectedSource);
    setDeleteModalVisibility(true);
  };

  const executeDataSourceDeletion = () => {
    setDeleteModalVisibility(false);
    setDeletingDatasource(true);
    datasourceService
      .deleteDataSource(selectedDataSource.id)
      .then(() => {
        toast.success('Data Source Deleted');
        setDeletingDatasource(false);
        setSelectedDataSource(null);
        dataSourcesChanged();
        globalDataSourcesChanged();
        dataQueriesChanged();
      })
      .catch(({ error }) => {
        setDeletingDatasource(false);
        setSelectedDataSource(null);
        toast.error(error);
      });
  };

  const cancelDeleteDataSource = () => {
    setDeleteModalVisibility(false);
    setSelectedDataSource(null);
  };

  const changeScope = (dataSource) => {
    setConversionVisible(false);
    globalDatasourceService
      .convertToGlobal(dataSource.id)
      .then(() => {
        dataSourcesChanged();
        globalDataSourcesChanged();
      })
      .catch(({ error }) => {
        setSelectedDataSource(null);
        toast.error(error);
      });
  };

  const getSourceMetaData = (dataSource) => {
    if (dataSource.plugin_id) {
      return dataSource.plugin?.manifest_file?.data.source;
    }

    return DataSourceTypes.find((source) => source.kind === dataSource.kind);
  };

  const renderDataSource = (dataSource, idx, convertToGlobal, showDeleteIcon = true, enableEdit = true) => {
    const sourceMeta = getSourceMetaData(dataSource);
    const icon = getSvgIcon(sourceMeta.kind.toLowerCase(), 24, 24, dataSource?.plugin?.icon_file?.data);

    const popover = (
      <PopoverBS id="popover-contained" className="table-list-items">
        <PopoverBS.Content className={`${darkMode && 'theme-dark'}`}>
          <div className={`row cursor-pointer`}>
            <div className="col-auto">{/* <EditIcon /> */}</div>
            <div
              className="col text-truncate cursor-pointer"
              onClick={() => {
                changeScope(dataSource);
              }}
            >
              Change scope
            </div>
          </div>
        </PopoverBS.Content>
      </PopoverBS>
    );

    return (
      <div className="row mb-3 ds-list-item" key={idx}>
        <div
          role="button"
          onClick={
            enableEdit
              ? () => {
                  setSelectedDataSource(dataSource);
                  toggleDataSourceManagerModal(true);
                }
              : null
          }
          className="col d-flex align-items-center"
        >
          {icon}
          <span className="font-400" style={{ paddingLeft: 5 }}>
            {dataSource.name}
          </span>
        </div>
        {showDeleteIcon && (
          <div className="col-auto">
            <button className="btn btn-sm p-1 ds-delete-btn" onClick={() => deleteDataSource(dataSource)}>
              <div>
                <TrashIcon width="14" height="14" />
              </div>
            </button>
          </div>
        )}
        {convertToGlobal && (
          <div className="col-auto">
            <OverlayTrigger
              onToggle={(isOpen) => {
                setConversionVisible(isOpen);
              }}
              show={isConversionVisible}
              rootClose
              trigger="click"
              placement="bottom"
              overlay={popover}
            >
              <VerticalIcon />
            </OverlayTrigger>
          </div>
        )}
      </div>
    );
  };

  const popoverContent = (
    <LeftSidebarDataSources.Container
      darkMode={darkMode}
      renderDataSource={renderDataSource}
      dataSources={dataSources}
      globalDataSources={globalDataSources}
      toggleDataSourceManagerModal={toggleDataSourceManagerModal}
    />
  );

  return (
    <>
      <ConfirmDialog
        show={isDeleteModalVisible}
        message={'You will lose all the queries created from this data source. Do you really want to delete?'}
        confirmButtonLoading={isDeletingDatasource}
        onConfirm={() => executeDataSourceDeletion()}
        onCancel={() => cancelDeleteDataSource()}
        darkMode={darkMode}
      />
      <Popover
        handleToggle={(open) => {
          if (!open) setSelectedSidebarItem('');
        }}
        popoverContentClassName="p-0 sidebar-h-100-popover"
        side="right"
        popoverContent={popoverContent}
        popoverContentHeight={popoverContentHeight}
      >
        <LeftSidebarItem
          selectedSidebarItem={selectedSidebarItem}
          onClick={() => setSelectedSidebarItem('database')}
          icon="database"
          className={`left-sidebar-item sidebar-datasources left-sidebar-layout`}
          tip="Sources"
        />
      </Popover>

      <DataSourceManager
        appId={appId}
        showDataSourceManagerModal={showDataSourceManagerModal}
        darkMode={darkMode}
        hideModal={() => {
          setSelectedDataSource(null);
          toggleDataSourceManagerModal(false);
        }}
        editingVersionId={editingVersionId}
        dataSourcesChanged={dataSourcesChanged}
        globalDataSourcesChanged={globalDataSourcesChanged}
        selectedDataSource={selectedDataSource}
      />
    </>
  );
};

const LeftSidebarDataSourcesContainer = ({
  darkMode,
  renderDataSource,
  dataSources = [],
  globalDataSources = [],
  toggleDataSourceManagerModal,
}) => {
  const { t } = useTranslation();
  return (
    <div>
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="Datasources">
          <div className="d-flex justify-content-end float-right" style={{ maxWidth: 48 }}>
            <Button
              styles={{ width: '28px', padding: 0 }}
              onClick={() => toggleDataSourceManagerModal(true)}
              darkMode={darkMode}
              size="sm"
            >
              <Button.Content iconSrc={'assets/images/icons/plus.svg'} direction="left" />
            </Button>
          </div>
        </HeaderSection.PanelHeader>
      </HeaderSection>
      <div className="card-body pb-5">
        <div className="d-flex w-100 flex-column align-items-start">
          {dataSources.length === 0 ? (
            <center
              onClick={() => toggleDataSourceManagerModal(true)}
              className="p-2 color-primary cursor-pointer"
              data-cy="add-datasource-link"
            >
              {t(`leftSidebar.Sources.addDataSource`, '+ add data source')}
            </center>
          ) : (
            <div className="d-flex flex-column w-100">
              <div className="tj-text-sm my-2 datasources-category">Local Datasources</div>
              <div className="mt-2 w-100" data-cy="datasource-Label">
                {dataSources?.map((source, idx) => renderDataSource(source, idx, true, true))}
              </div>
            </div>
          )}
          {globalDataSources.length ? (
            <>
              <div className="tj-text-sm my-2 datasources-category">Global Datasources</div>
              <div className="mt-2 w-100">
                {globalDataSources?.map((source, idx) => renderDataSource(source, idx, false, false))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

LeftSidebarDataSources.Container = LeftSidebarDataSourcesContainer;
