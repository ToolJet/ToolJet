import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import Select from '@/_ui/Select';
import { operators } from '@/TooljetDatabase/constants';
import { isOperatorOptions } from './util';
import CodeHinter from '@/Editor/CodeEditor';
import ButtonComponent from '@/components/ui/Button/Index';

export const ListRows = React.memo(({ darkMode }) => {
  const { columns, listRowsOptions, limitOptionChanged, handleOptionsChange, offsetOptionChanged } =
    useContext(TooljetDatabaseContext);

  function handleWhereFiltersChange(filters) {
    handleOptionsChange('where_filters', filters);
  }

  function handleOrderFiltersChange(filters) {
    handleOptionsChange('order_filters', filters);
  }

  function addNewFilterConditionPair() {
    const existingFilters = listRowsOptions?.where_filters ? Object.values(listRowsOptions?.where_filters) : [];
    const emptyFilter = { column: '', operator: '', value: '' };
    const newFilter = { ...emptyFilter, ...{ id: uuidv4() } };
    handleWhereFiltersChange({ ...existingFilters, ...{ [newFilter.id]: newFilter } });
  }

  function addNewSortConditionPair() {
    const existingFilters = listRowsOptions?.order_filters ? Object.values(listRowsOptions?.order_filters) : [];
    const emptyFilter = { column: '', order: '' };
    const newFilter = { ...emptyFilter, ...{ id: uuidv4() } };
    handleOrderFiltersChange({ ...existingFilters, ...{ [newFilter.id]: newFilter } });
  }

  function removeFilterConditionPair(id) {
    const existingFilters = listRowsOptions?.where_filters ? Object.values(listRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.filter((f) => f.id !== id);
    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  function removeSortConditionPair(id) {
    const existingFilters = listRowsOptions?.order_filters ? Object.values(listRowsOptions?.order_filters) : [];
    const updatedFilters = existingFilters.filter((f) => f.id !== id);
    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleOrderFiltersChange(updatedFiltersObject);
  }

  function updateFilterOptionsChanged(filter) {
    const existingFilters = listRowsOptions?.where_filters ? Object.values(listRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.map((f) => (f.id === filter.id ? filter : f));

    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  function updateSortOptionsChanged(filter) {
    const existingFilters = listRowsOptions?.order_filters ? Object.values(listRowsOptions?.order_filters) : [];
    const updatedFilters = existingFilters.map((f) => (f.id === filter.id ? filter : f));

    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleOrderFiltersChange(updatedFiltersObject);
  }

  return (
    <div>
      <div className="row my-2 tj-db-field-wrapper">
        <div className="tab-content-wrapper">
          <div className="d-flex mb-2">
            <label className="form-label" data-cy="label-column-filter">
              Filter
            </label>
            <div className="field-container col">
              {Object.values(listRowsOptions?.where_filters || {}).map((filter) => (
                <RenderFilterFields
                  key={filter.id}
                  {...filter}
                  columns={columns}
                  listRowsOptions={listRowsOptions}
                  updateFilterOptionsChanged={updateFilterOptionsChanged}
                  darkMode={darkMode}
                  removeFilterConditionPair={removeFilterConditionPair}
                />
              ))}
              <ButtonComponent
                leadingIcon="plus01"
                onClick={() => {
                  addNewFilterConditionPair();
                }}
                variant="ghostBrand"
                size="medium"
                className={isEmpty(listRowsOptions?.where_filters || {}) ? '' : 'tw-mt-2'}
              >
                Add Condition
              </ButtonComponent>
            </div>
          </div>

          {/* sort */}
          <div className="fields-container d-flex mb-2">
            <label className="form-label" data-cy="label-column-sort">
              Sort
            </label>
            <div className="field-container flex-grow-1">
              {Object.values(listRowsOptions?.order_filters || {}).map((filter) => (
                <RenderSortFields
                  key={filter.id}
                  {...filter}
                  removeSortConditionPair={removeSortConditionPair}
                  listRowsOptions={listRowsOptions}
                  columns={columns}
                  updateSortOptionsChanged={updateSortOptionsChanged}
                />
              ))}
              <ButtonComponent
                leadingIcon="plus01"
                onClick={() => {
                  addNewSortConditionPair();
                }}
                variant="ghostBrand"
                size="medium"
                className={isEmpty(listRowsOptions?.order_filters || {}) ? '' : 'tw-mt-2'}
              >
                Add Condition
              </ButtonComponent>
            </div>
          </div>

          {/* Limit */}
          <div className="field-container d-flex mb-2">
            <label className="form-label" data-cy="label-column-limit">
              Limit
            </label>
            <div className="field flex-grow-1">
              <CodeHinter
                type="basic"
                initialValue={listRowsOptions?.limit ?? ''}
                className="codehinter-plugins"
                placeholder="Enter limit"
                onChange={(newValue) => limitOptionChanged(newValue)}
              />
            </div>
          </div>
          {/* Offset */}
          <div className="field-container d-flex">
            <label className="form-label" data-cy="label-column-offset">
              Offset
            </label>
            <div className="field flex-grow-1">
              <CodeHinter
                type="basic"
                initialValue={listRowsOptions?.offset ?? ''}
                className="codehinter-plugins"
                placeholder="Enter offset"
                onChange={(newValue) => offsetOptionChanged(newValue)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const RenderSortFields = ({
  column,
  order,
  id,
  removeSortConditionPair,
  listRowsOptions,
  columns,
  updateSortOptionsChanged,
}) => {
  const orders = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];
  const existingColumnOptions = Object.values(listRowsOptions?.order_filters).map((item) => item.column);
  let displayColumns = columns.map(({ accessor }) => ({
    value: accessor,
    label: accessor,
  }));

  if (existingColumnOptions.length > 0) {
    displayColumns = displayColumns.filter(
      ({ value }) => !existingColumnOptions.map((item) => item !== column && item).includes(value)
    );
  }

  const handleColumnChange = (selectedOption) => {
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ column: selectedOption } });
  };

  const handleDirectionChange = (selectedOption) => {
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ order: selectedOption } });
  };

  return (
    <div className="mt-1 row-container">
      <div className="d-flex fields-container mb-2">
        <div className="field col">
          <Select
            useMenuPortal={true}
            placeholder="Select column"
            value={column}
            options={displayColumns}
            onChange={handleColumnChange}
          />
        </div>
        <div className="field col mx-1">
          <Select
            useMenuPortal={true}
            placeholder="Select direction"
            value={order}
            options={orders}
            onChange={handleDirectionChange}
          />
        </div>
        <div className="col cursor-pointer m-1 ms-1">
          <ButtonComponent
            fill="red"
            iconOnly
            leadingIcon="delete"
            onClick={() => removeSortConditionPair(id)}
            variant="ghost"
            size="medium"
          />
        </div>
      </div>
    </div>
  );
};

const RenderFilterFields = ({
  column,
  operator,
  value,
  id,
  columns,
  listRowsOptions,
  updateFilterOptionsChanged,
  removeFilterConditionPair,
  darkMode,
}) => {
  let displayColumns = columns.map(({ accessor }) => ({
    value: accessor,
    label: accessor,
  }));

  const handleColumnChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ column: selectedOption } });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ operator: selectedOption } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  return (
    <div className="mt-1 row-container">
      <div className="d-flex fields-container ">
        <div className="field" style={{ width: '32%' }}>
          <Select
            useMenuPortal={true}
            placeholder="Select column"
            value={column}
            options={displayColumns}
            onChange={handleColumnChange}
            // useCustomStyles
            // styles={{ container: (styles) => ({ width: 'auto', ...styles }) }}
            width={'auto'}
          />
        </div>
        <div className="field  mx-1" style={{ width: '32%' }}>
          <Select
            useMenuPortal={true}
            placeholder="Select operation"
            value={operator}
            options={operators}
            onChange={handleOperatorChange}
            width={'auto'}
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
              width={'auto'}
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
            fill="red"
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
