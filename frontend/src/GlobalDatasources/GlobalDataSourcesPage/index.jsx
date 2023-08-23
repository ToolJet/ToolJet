import React, { useContext, useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import { Sidebar } from '../Sidebar';
import { GlobalDataSourcesContext } from '..';
import { DataSourceManager } from '../../Editor/DataSourceManager';
import DataSourceFolder from '@assets/images/icons/datasource-folder.svg';

export const GlobalDataSourcesPage = ({ darkMode = false, updateSelectedDatasource }) => {
  const containerRef = useRef(null);
  const [modalProps, setModalProps] = useState({
    backdrop: false,
    dialogClassName: `datasource-edit-modal`,
    enforceFocus: false,
  });

  const {
    dataSources,
    setSelectedDataSource,
    selectedDataSource,
    fetchDataSources,
    showDataSourceManagerModal,
    toggleDataSourceManagerModal,
    handleModalVisibility,
    isEditing,
    setEditing,
    currentEnvironment,
    environments,
    setCurrentEnvironment,
  } = useContext(GlobalDataSourcesContext);

  useEffect(() => {
    if (selectedDataSource) {
      setModalProps({ ...modalProps, backdrop: false });
    }

    if (!isEditing) {
      setModalProps({ ...modalProps, backdrop: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataSource, isEditing]);

  const handleHideModal = () => {
    if (dataSources?.length) {
      if (!isEditing) {
        setEditing(true);
        setSelectedDataSource(dataSources[0]);
        updateSelectedDatasource(dataSources[0]?.name);
      } else {
        setSelectedDataSource(null);
        setEditing(true);
        toggleDataSourceManagerModal(false);
      }
    } else {
      handleModalVisibility();
      setEditing(true);
    }
  };

  const environmentChanged = (env) => {
    setCurrentEnvironment(env);
  };

  const dataSourcesChanged = (resetSelection, dataSource) => {
    setCurrentEnvironment(environments[0]);
    fetchDataSources(resetSelection, dataSource);
  };

  return (
    <div className="row gx-0">
      <Sidebar updateSelectedDatasource={updateSelectedDatasource} />
      <div
        ref={containerRef}
        className={cx('col animation-fade datasource-modal-container', {})}
      >
        {containerRef && containerRef?.current && (
          <DataSourceManager
            showBackButton={selectedDataSource ? false : true}
            showDataSourceManagerModal={showDataSourceManagerModal}
            darkMode={darkMode}
            hideModal={handleHideModal}
            scope="global"
            dataSourcesChanged={dataSourcesChanged}
            selectedDataSource={selectedDataSource}
            modalProps={modalProps}
            currentEnvironment={currentEnvironment}
            environments={environments}
            environmentChanged={environmentChanged}
            container={selectedDataSource ? containerRef?.current : null}
            isEditing={isEditing}
            updateSelectedDatasource={updateSelectedDatasource}
          />
        )}
        {!selectedDataSource && isEditing && (
          <div className="main-empty-container">
            <div className="icon-container">
              <DataSourceFolder />
            </div>
            <div className="heading tj-text-lg mt-2">Datasources</div>
            <div className="sub-heading text-secondary tj-text-md mt-2">
              Connect your app with REST API, PGSQL, MongoDB, Stripe and 40+ other datasources
            </div>
            <button
              className="add-datasource-btn btn btn-primary active w-100 mt-3"
              type="button"
              onClick={() => {
                handleModalVisibility();
                setEditing(false);
              }}
            >
              Add new datasource
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
