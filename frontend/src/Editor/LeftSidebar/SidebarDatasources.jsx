/* eslint-disable import/no-named-as-default */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeaderSection, Button } from '@/_ui/LeftSidebar';
import { DataSourceManager } from '../DataSourceManager';
import { DataSourceTypes } from '../DataSourceManager/SourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import { datasourceService, globalDatasourceService, authenticationService } from '@/_services';
import { ConfirmDialog } from '@/_components';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Popover as PopoverBS, OverlayTrigger } from 'react-bootstrap';
// eslint-disable-next-line import/no-unresolved
import TrashIcon from '@assets/images/icons/query-trash-icon.svg';
import VerticalIcon from '@assets/images/icons/vertical-menu.svg';
import { getPrivateRoute } from '@/_helpers/routes';
import { useDataSources } from '@/_stores/dataSourcesStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const LeftSidebarDataSources = ({
  appId,
  darkMode,
  dataSourcesChanged,
  globalDataSourcesChanged,
  dataQueriesChanged,
  toggleDataSourceManagerModal,
  showDataSourceManagerModal,
  onDeleteofAllDataSources,
  setPinned,
  pinned,
}) => {
  const dataSources = useDataSources();
  const [selectedDataSource, setSelectedDataSource] = React.useState(null);
  const [isDeleteModalVisible, setDeleteModalVisibility] = React.useState(false);
  const [isDeletingDatasource, setDeletingDatasource] = React.useState(false);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  useEffect(() => {
    if (dataSources.length === 0) {
      onDeleteofAllDataSources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources.length]);

  const { admin } = authenticationService.currentSessionValue;

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
        dataQueriesChanged({ isReloadSelf: true });
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
    globalDatasourceService
      .convertToGlobal(dataSource.id)
      .then(() => {
        dataSourcesChanged();
        globalDataSourcesChanged();
        toast.success('Data Source scope changed');
      })
      .catch(({ error }) => {
        setSelectedDataSource(null);
        toast.error(error);
      });
  };

  const getSourceMetaData = (dataSource) => {
    if (dataSource.pluginId) {
      const srcMeta = dataSource.plugin?.manifestFile?.data.source || undefined;

      return srcMeta;
    }

    return DataSourceTypes.find((source) => source.kind === dataSource.kind);
  };

  const RenderDataSource = ({ dataSource, idx, convertToGlobal, showDeleteIcon = true, enableEdit = true }) => {
    const [isConversionVisible, setConversionVisible] = React.useState(false);
    const sourceMeta = getSourceMetaData(dataSource);

    const icon = getSvgIcon(sourceMeta?.kind?.toLowerCase(), 24, 24, dataSource?.plugin?.iconFile?.data);

    const convertToGlobalDataSource = (dataSource) => {
      setConversionVisible(false);
      changeScope(dataSource);
    };

    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (isConversionVisible && event.target.closest('.popover-change-scope') === null) {
          setConversionVisible(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify({ dataSource, isConversionVisible })]);

    const popover = (
      <PopoverBS
        key={dataSource.id}
        id="popover-change-scope"
      >
        <PopoverBS.Body
          key={dataSource.id}
          className={`${darkMode && 'theme-dark popover-dark-themed'}`}
        >
          <div className={`row cursor-pointer`}>
            <div
              className="col text-truncate cursor-pointer"
              onClick={() => convertToGlobalDataSource(dataSource)}
            >
              Change scope
            </div>
          </div>
        </PopoverBS.Body>
      </PopoverBS>
    );

    return (
      <div
        className="row mb-3 ds-list-item"
        key={idx}
      >
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
          <span
            className="font-400"
            style={{ paddingLeft: 5 }}
          >
            {dataSource.name}
          </span>
        </div>
        {showDeleteIcon && !isVersionReleased && (
          <div className="col-auto">
            <button
              className="btn btn-sm p-1 ds-delete-btn"
              onClick={() => deleteDataSource(dataSource)}
            >
              <div>
                <TrashIcon
                  width="14"
                  height="14"
                />
              </div>
            </button>
          </div>
        )}
        {convertToGlobal && admin && !isVersionReleased && (
          <div className="col-auto">
            <OverlayTrigger
              rootClose={false}
              show={isConversionVisible}
              trigger="click"
              placement="bottom"
              overlay={popover}
            >
              <div onClick={() => setConversionVisible(!isConversionVisible)}>
                <VerticalIcon />
              </div>
            </OverlayTrigger>
          </div>
        )}
      </div>
    );
  };

  if (dataSources?.length <= 0) return;

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
      <LeftSidebarDataSources.Container
        darkMode={darkMode}
        RenderDataSource={RenderDataSource}
        dataSources={dataSources}
        toggleDataSourceManagerModal={toggleDataSourceManagerModal}
        setPinned={setPinned}
        pinned={pinned}
      />
      <DataSourceManager
        appId={appId}
        showDataSourceManagerModal={showDataSourceManagerModal}
        darkMode={darkMode}
        hideModal={() => {
          setSelectedDataSource(null);
          toggleDataSourceManagerModal(false);
        }}
        dataSourcesChanged={dataSourcesChanged}
        globalDataSourcesChanged={globalDataSourcesChanged}
        selectedDataSource={selectedDataSource}
        isVersionReleased={isVersionReleased}
      />
    </>
  );
};

const LeftSidebarDataSourcesContainer = ({ darkMode, RenderDataSource, dataSources = [], setPinned, pinned }) => {
  const { t } = useTranslation();
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  return (
    <div>
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="Datasources">
          <div className="d-flex justify-content-end">
            <Button
              title={`${pinned ? 'Unpin' : 'Pin'}`}
              onClick={() => setPinned(!pinned)}
              darkMode={darkMode}
              size="sm"
              styles={{ width: '28px', padding: 0 }}
            >
              <Button.Content
                iconSrc={`assets/images/icons/editor/left-sidebar/pinned${pinned ? 'off' : ''}.svg`}
                direction="left"
              />
            </Button>
          </div>
        </HeaderSection.PanelHeader>
      </HeaderSection>
      <div className="card-body pb-5">
        <div className="d-flex w-100 flex-column align-items-start">
          <div className="d-flex flex-column w-100">
            {dataSources.length ? (
              <>
                <div className="tj-text-sm my-2 datasources-category">Local Datasources</div>
                <div
                  className="mt-2 w-100"
                  data-cy="datasource-Label"
                >
                  {dataSources?.map((source, idx) => (
                    <RenderDataSource
                      key={idx}
                      dataSource={source}
                      idx={idx}
                      convertToGlobal={true}
                      showDeleteIcon={true}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {!isVersionReleased && (
        <div className="add-datasource-btn w-100 p-3">
          <Link to={getPrivateRoute('global_datasources')}>
            <div className="p-2 color-primary cursor-pointer">
              {t(`leftSidebar.Sources.addDataSource`, '+ add data source')}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

LeftSidebarDataSources.Container = LeftSidebarDataSourcesContainer;
