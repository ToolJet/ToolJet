import React, { useContext, useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import { Sidebar } from '../Sidebar';
import { GlobalDataSourcesContext } from '..';
import { DataSourceManager } from '../../Editor/DataSourceManager';

export const GlobalDataSourcesPage = ({ darkMode }) => {
  const containerRef = useRef(null);
  const [modalProps, setModalProps] = useState({
    backdrop: true,
    dialogClassName: 'datasource-edit-modal',
  });

  const {
    setSelectedDataSource,
    selectedDataSource,
    fetchDataSources,
    showDataSourceManagerModal,
    toggleDataSourceManagerModal,
  } = useContext(GlobalDataSourcesContext);

  useEffect(() => {
    if (selectedDataSource) {
      setModalProps({ ...modalProps, backdrop: false });
    } else {
      setModalProps({ ...modalProps, backdrop: true });
    }
  }, [selectedDataSource]);

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
            showDataSourceManagerModal={showDataSourceManagerModal}
            darkMode={darkMode}
            hideModal={() => {
              setSelectedDataSource(null);
              toggleDataSourceManagerModal(false);
            }}
            scope="global"
            dataSourcesChanged={fetchDataSources}
            selectedDataSource={selectedDataSource}
            modalProps={modalProps}
            container={selectedDataSource ? containerRef?.current : null}
          />
        )}
      </div>
    </div>
  );
};
