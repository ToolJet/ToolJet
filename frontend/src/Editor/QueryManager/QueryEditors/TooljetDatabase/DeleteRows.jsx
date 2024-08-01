import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import Select from '@/_ui/Select';
import { operators } from '@/TooljetDatabase/constants';
import { isOperatorOptions } from './util';
import CodeHinter from '@/Editor/CodeEditor';
import ButtonComponent from '@/components/ui/Button/Index';

export const DeleteRows = React.memo(({ darkMode }) => {
  const { columns, deleteOperationLimitOptionChanged, deleteRowsOptions, handleDeleteRowsOptionsChange } =
    useContext(TooljetDatabaseContext);

  function handleWhereFiltersChange(filters) {
    handleDeleteRowsOptionsChange('where_filters', filters);
  }

  function addNewFilterConditionPair() {
    const existingFilters = deleteRowsOptions?.where_filters ? Object.values(deleteRowsOptions?.where_filters) : [];
    const emptyFilter = { column: '', operator: '', value: '' };
    const newFilter = { ...emptyFilter, ...{ id: uuidv4() } };
    handleWhereFiltersChange({ ...existingFilters, ...{ [newFilter.id]: newFilter } });
  }

  function removeFilterConditionPair(id) {
    const existingFilters = deleteRowsOptions?.where_filters ? Object.values(deleteRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.filter((f) => f.id !== id);
    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  function updateFilterOptionsChanged(filter) {
    const existingFilters = deleteRowsOptions?.where_filters ? Object.values(deleteRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.map((f) => (f.id === filter.id ? filter : f));

    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  return (
    <div className="tab-content-wrapper tj-db-field-wrapper mt-2">
      <div className="d-flex">
        <label className="form-label" data-cy="label-column-filter">
          Filter
        </label>

        <div className="field-container flex-grow-1  mb-2 col">
          {Object.values(deleteRowsOptions?.where_filters || {}).map((filter) => (
            <RenderFilterFields
              key={filter.id}
              {...filter}
              removeFilterConditionPair={removeFilterConditionPair}
              updateFilterOptionsChanged={updateFilterOptionsChanged}
              deleteRowsOptions={deleteRowsOptions}
              columns={columns}
              darkMode={darkMode}
            />
          ))}
          <ButtonComponent
            leadingIcon="plus01"
            onClick={addNewFilterConditionPair}
            variant="ghostBrand"
            size="medium"
            className={isEmpty(deleteRowsOptions?.where_filters || {}) ? '' : 'tw-mt-2'}
          >
            Add Condition
          </ButtonComponent>
        </div>
      </div>
      <div className="field-container d-flex">
        <label className="form-label" data-cy="label-column-limit">
          Limit
        </label>
        <div className="field flex-grow-1">
          <CodeHinter
            type="basic"
            initialValue={deleteRowsOptions?.limit ?? 1}
            className="codehinter-plugins"
            placeholder="Enter limit. Default is 1"
            onChange={(newValue) => deleteOperationLimitOptionChanged(newValue)}
          />
        </div>
      </div>
    </div>
  );
});

const RenderFilterFields = ({
  column,
  operator,
  value,
  id,
  removeFilterConditionPair,
  columns,
  updateFilterOptionsChanged,
  deleteRowsOptions,
  darkMode,
}) => {
  let displayColumns = columns.map(({ accessor }) => ({
    value: accessor,
    label: accessor,
  }));

  const handleColumnChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...deleteRowsOptions?.where_filters[id], ...{ column: selectedOption } });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...deleteRowsOptions?.where_filters[id], ...{ operator: selectedOption } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...deleteRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  return (
    <div className="mt-1 row-container w-100">
      <div className="d-flex fields-container">
        <div className="field" style={{ width: '32%' }}>
          <Select
            useMenuPortal={true}
            placeholder="Select column"
            value={column}
            options={displayColumns}
            onChange={handleColumnChange}
            width="auto"
          />
        </div>
        <div className="field col mx-1" style={{ width: '32%' }}>
          <Select
            useMenuPortal={true}
            placeholder="Select operation"
            value={operator}
            options={operators}
            onChange={handleOperatorChange}
            width="auto"
          />
        </div>
        <div className="field" style={{ width: '32%' }}>
          {operator === 'is' ? (
            <Select
              useMenuPortal={true}
              placeholder="Select value"
              value={value}
              options={isOperatorOptions}
              onChange={handleValueChange}
              width="auto"
            />
          ) : (
            <CodeHinter
              type="basic"
              initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
              className="codehinter-plugins"
              placeholder="key"
              onChange={(newValue) => handleValueChange(newValue)}
            />
          )}
        </div>
        <div
          className="col-1 cursor-pointer m-1 d-flex align-item-center justify-content-center"
          style={{ width: '4%' }}
        >
          <ButtonComponent
            fill="#E54D2E"
            iconOnly
            leadingIcon="delete"
            onClick={() => removeFilterConditionPair(id)}
            variant="ghost"
            size="medium"
          />
        </div>
      </div>
    </div>
  );
};
