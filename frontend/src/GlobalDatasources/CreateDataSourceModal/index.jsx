import React, { useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { GlobalDataSourcesContext } from '../index';
import { List } from '../List';

export const CreateDataSourceModal = () => {
  const { setSelectedDataSource, toggleDataSourceManagerModal } = useContext(GlobalDataSourcesContext);

  const handleModalVisibility = () => {
    setSelectedDataSource(null);
    toggleDataSourceManagerModal(true);
  };

  return (
    <div className="col global-datasources-sidebar border-end">
      <div className="p-3">
        <button
          className="add-datasource-btn btn btn-primary active w-100"
          type="button"
          onClick={handleModalVisibility}
        >
          Add new datasource
        </button>
      </div>
      <List />
    </div>
  );
};
