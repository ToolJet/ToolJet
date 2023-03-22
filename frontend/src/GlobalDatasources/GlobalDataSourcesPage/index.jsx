import React, { useContext, useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import { Sidebar } from '../Sidebar';
import { GlobalDataSourcesContext } from '..';
import { DataSourceManager } from '../../Editor/DataSourceManager';
import DataSourceFolder from '@assets/images/icons/datasource-folder.svg';

export const GlobalDataSourcesPage = ({ darkMode }) => {
  const containerRef = useRef(null);
  const [modalProps, setModalProps] = useState({
    backdrop: true,
    dialogClassName: 'datasource-edit-modal',
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
  } = useContext(GlobalDataSourcesContext);

  useEffect(() => {
    if (selectedDataSource) {
      setModalProps({ ...modalProps, backdrop: false });
    } else {
      setModalProps({ ...modalProps, backdrop: true });
    }
  }, [selectedDataSource]);

  const handleHideModal = () => {
    if (dataSources?.length) {
      if (!isEditing) {
        setEditing(true);
        setSelectedDataSource(dataSources[0]);
      } else {
        setSelectedDataSource(null);
        setEditing(true);
        toggleDataSourceManagerModal(false);
      }
    } else {
      handleModalVisibility();
    }
  };

  return (
    <div className="row gx-0">
      <Sidebar />
      <div
        ref={containerRef}
        className={cx('col animation-fade datasource-modal-container', {
          'bg-light-gray': !darkMode,
        })}
      >
        {containerRef && containerRef?.current && (
          <DataSourceManager
            showBackButton={selectedDataSource ? false : true}
            showDataSourceManagerModal={showDataSourceManagerModal}
            darkMode={darkMode}
            hideModal={handleHideModal}
            scope="global"
            dataSourcesChanged={fetchDataSources}
            selectedDataSource={selectedDataSource}
            modalProps={modalProps}
            container={selectedDataSource ? containerRef?.current : null}
          />
        )}
        {!selectedDataSource && isEditing && (
          <div className="main-empty-container">
            <div className="icon-container">
              <DataSourceFolder />
            </div>
            <div className="heading tj-text-lg mt-2">Datasource 101</div>
            <div className="sub-heading text-secondary tj-text-md mt-2">
              Connect your app with REST API, PGSQL, MongoDB, Stripe and 40+ other datasources
            </div>
            <button
              className="add-datasource-btn btn btn-primary active w-100 mt-3"
              type="button"
              onClick={handleModalVisibility}
            >
              Add new datasource
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
