import React, { useContext } from 'react';
import { GlobalDataSourcesContext } from '../index';
import { List } from '../List';

export const CreateDataSourceModal = ({ updateSelectedDatasource }) => {
  const { handleModalVisibility, setEditing } = useContext(GlobalDataSourcesContext);

  return (
    <div className="col border-end">
      <div className="add-new-datasource-header-container">
        <button
          className="add-datasource-btn btn btn-primary active w-100"
          type="button"
          onClick={() => {
            handleModalVisibility();
            setEditing(false);
          }}
          data-cy="add-new-data-source-button"
        >
          Add new datasource
        </button>
      </div>
      <List updateSelectedDatasource={updateSelectedDatasource} />
    </div>
  );
};
