import React, { useContext, useState } from 'react';
import { GlobalDataSourcesContext } from '../index';
import { DataSourceManager } from '../../Editor/DataSourceManager';
import { List } from '../List';

export const CreateDataSourceModal = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const modalProps = {
    backdrop: false,
    dialogClassName: 'datasource-edit-modal',
  };

  const {
    setSelectedDataSource,
    selectedDataSource,
    fetchDataSources,
    showDataSourceManagerModal,
    toggleDataSourceManagerModal,
  } = useContext(GlobalDataSourcesContext);
  return (
    <div className="col global-datasources-sidebar border-end">
      <div className="p-3">
        <button
          className="add-datasource-btn btn btn-primary active w-100"
          type="button"
          onClick={() => toggleDataSourceManagerModal(!showDataSourceManagerModal)}
        >
          Add new datasource
        </button>
      </div>
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
      />
      <List />
    </div>
  );
};
