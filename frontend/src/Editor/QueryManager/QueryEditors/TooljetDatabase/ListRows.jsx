import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { operators } from '@/TooljetDatabase/constants';
import { isOperatorOptions } from './util';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { AggregateFilter } from './AggregateUI';
import RenderFilterSectionUI from './RenderFilterSectionUI';
import RenderSortUI from './RenderSortUI';
import { NoCondition } from './NoConditionUI';

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
          <AggregateFilter darkMode={darkMode} operation="listRows" />
          <div className="d-flex tooljetdb-worflow-operations mb-2">
            <label className="form-label flex-shrink-0" data-cy="label-column-filter">
              Filter
            </label>
            <div className="field-container flex-grow-1">
              {isEmpty(listRowsOptions?.where_filters || {}) && <NoCondition />}
              {!isEmpty(listRowsOptions.where_filters) &&
                Object.values(listRowsOptions?.where_filters || {}).map((filter) => (
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

              <ButtonSolid
                variant="ghostBlue"
                size="sm"
                onClick={() => {
                  addNewFilterConditionPair();
                }}
                className={isEmpty(listRowsOptions?.where_filters || {}) ? '' : 'mt-2'}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
                    fill="#466BF2"
                  />
                </svg>
                &nbsp;Add Condition
              </ButtonSolid>
            </div>
          </div>

          {/* sort */}
          <div className="fields-container tooljetdb-worflow-operations d-flex mb-2">
            <label className="form-label flex-shrink-0" data-cy="label-column-sort">
              Sort
            </label>
            <div
              className={`field-container flex-grow-1 ${!isEmpty(listRowsOptions?.order_filters) && 'minw-400-w-400'} `}
            >
              {isEmpty(listRowsOptions?.order_filters || {}) && <NoCondition />}
              {!isEmpty(listRowsOptions?.order_filters) &&
                Object.values(listRowsOptions?.order_filters || {}).map((filter) => (
                  <RenderSortFields
                    key={filter.id}
                    {...filter}
                    removeSortConditionPair={removeSortConditionPair}
                    listRowsOptions={listRowsOptions}
                    columns={columns}
                    updateSortOptionsChanged={updateSortOptionsChanged}
                    darkMode={darkMode}
                  />
                ))}
              <ButtonSolid
                variant="ghostBlue"
                size="sm"
                onClick={() => {
                  addNewSortConditionPair();
                }}
                className={isEmpty(listRowsOptions?.order_filters || {}) ? '' : 'mt-2'}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
                    fill="#466BF2"
                  />
                </svg>
                &nbsp;Add Condition
              </ButtonSolid>
            </div>
          </div>

          {/* Limit */}
          <div className="field-container tooljetdb-worflow-operations d-flex mb-2">
            <label className="form-label flex-shrink-0" data-cy="label-column-limit">
              Limit
            </label>
            <div className="field flex-grow-1 minw-400-w-400 tjdb-limit-offset-codehinter">
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
          <div className="field-container tooljetdb-worflow-operations d-flex">
            <label className="form-label flex-shrink-0" data-cy="label-column-offset">
              Offset
            </label>
            <div className="field flex-grow-1 minw-400-w-400 tjdb-limit-offset-codehinter">
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
  darkMode,
}) => {
  const orders = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  order = orders.find((val) => val.value === order);

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
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ column: selectedOption.value } });
  };

  const handleDirectionChange = (selectedOption) => {
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ order: selectedOption.value } });
  };

  return (
    <RenderSortUI
      column={column}
      displayColumns={displayColumns}
      handleColumnChange={handleColumnChange}
      darkMode={darkMode}
      order={order}
      orders={orders}
      handleDirectionChange={handleDirectionChange}
      removeSortConditionPair={removeSortConditionPair}
      id={id}
    />
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
  operator = operators.find((val) => val.value === operator);

  const handleColumnChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ column: selectedOption.value } });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ operator: selectedOption.value } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  return (
    <RenderFilterSectionUI
      column={column}
      displayColumns={displayColumns}
      handleColumnChange={handleColumnChange}
      darkMode={darkMode}
      operator={operator}
      operators={operators}
      handleOperatorChange={handleOperatorChange}
      value={value}
      isOperatorOptions={isOperatorOptions}
      handleValueChange={handleValueChange}
      removeFilterConditionPair={removeFilterConditionPair}
      id={id}
    />
  );
};
