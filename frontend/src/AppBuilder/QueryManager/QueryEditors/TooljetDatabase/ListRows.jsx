import { Button as RadixButton } from '@/components/ui/Button/Button';
import React from 'react';
import { useToolJetDbOperationsContext } from './ToolJetDbOperationsContext';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { operators } from '@/_helpers/constants';
import { isOperatorOptions, resolveColumnDisplayName, columnIdOf } from './util';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { AggregateFilter } from './AggregateUI';
import RenderFilterSectionUI from './RenderFilterSectionUI';
import RenderSortUI from './RenderSortUI';
import { NoCondition } from './NoConditionUI';

export const ListRows = React.memo(({ darkMode }) => {
  const { columns, listRowsOptions, limitOptionChanged, handleOptionsChange, offsetOptionChanged } =
    useToolJetDbOperationsContext();

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
    <div className="tooljetdb-operation-form tooljetdb-list-rows">
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

              <RadixButton
                isLucid
                size="medium"
                variant="outline"
                leadingIcon="plus"
                onClick={() => {
                  addNewFilterConditionPair();
                }}
                className={isEmpty(listRowsOptions?.where_filters || {}) ? '' : 'mt-2'}
              >
                Add Condition
              </RadixButton>
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
              <RadixButton
                isLucid
                size="medium"
                variant="outline"
                leadingIcon="plus"
                onClick={() => {
                  addNewSortConditionPair();
                }}
                className={isEmpty(listRowsOptions?.order_filters || {}) ? '' : 'mt-2'}
              >
                Add Condition
              </RadixButton>
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
  columnId,
  order,
  id,
  removeSortConditionPair,
  listRowsOptions,
  columns,
  updateSortOptionsChanged,
  darkMode,
  jsonpath = '',
}) => {
  const orders = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  order = orders.find((val) => val.value === order);

  const resolvedColumn = resolveColumnDisplayName(columns, column, columnId);
  const existingColumnOptions = Object.values(listRowsOptions?.order_filters).map((item) => item.column);
  let displayColumns = columns.map(({ accessor, dataType, column_id }) => ({
    value: accessor,
    label: accessor,
    icon: dataType,
    columnId: column_id,
  }));

  if (existingColumnOptions.length > 0) {
    displayColumns = displayColumns.filter(
      ({ value }) => !existingColumnOptions.map((item) => item !== resolvedColumn && item).includes(value)
    );
  }

  const handleColumnChange = (selectedOption) => {
    updateSortOptionsChanged({
      ...listRowsOptions?.order_filters[id],
      ...{ column: selectedOption.value, columnId: columnIdOf(selectedOption) },
    });
  };

  const handleDirectionChange = (selectedOption) => {
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ order: selectedOption.value } });
  };

  const handleJsonPathChange = (value) => {
    updateSortOptionsChanged({
      ...listRowsOptions?.order_filters[id],
      jsonpath: value,
    });
  };

  const isSelectedColumnJsonbType = columns.find((col) => col.accessor === resolvedColumn)?.dataType === 'jsonb';

  return (
    <RenderSortUI
      column={resolvedColumn}
      displayColumns={displayColumns}
      handleColumnChange={handleColumnChange}
      darkMode={darkMode}
      order={order}
      orders={orders}
      handleDirectionChange={handleDirectionChange}
      removeSortConditionPair={removeSortConditionPair}
      id={id}
      isSelectedColumnJsonbType={isSelectedColumnJsonbType}
      handleJsonPathChange={handleJsonPathChange}
      jsonpath={jsonpath}
    />
  );
};

const RenderFilterFields = ({
  column,
  columnId,
  operator,
  value,
  id,
  columns,
  listRowsOptions,
  updateFilterOptionsChanged,
  removeFilterConditionPair,
  darkMode,
  jsonpath = '',
}) => {
  const resolvedColumn = resolveColumnDisplayName(columns, column, columnId);
  let displayColumns = columns.map(({ accessor, dataType, column_id }) => ({
    value: accessor,
    label: accessor,
    icon: dataType,
    columnId: column_id,
  }));
  operator = operators.find((val) => val.value === operator);

  const handleColumnChange = (selectedOption) => {
    updateFilterOptionsChanged({
      ...listRowsOptions?.where_filters[id],
      ...{ column: selectedOption.value, columnId: columnIdOf(selectedOption) },
    });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ operator: selectedOption.value } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  const handleJsonPathChange = (value) => {
    updateFilterOptionsChanged({
      ...listRowsOptions?.where_filters[id],
      jsonpath: value,
    });
  };

  const isSelectedColumnJsonbType = columns.find((col) => col.accessor === resolvedColumn)?.dataType === 'jsonb';

  return (
    <RenderFilterSectionUI
      column={resolvedColumn}
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
      isSelectedColumnJsonbType={isSelectedColumnJsonbType}
      handleJsonPathChange={handleJsonPathChange}
      jsonpath={jsonpath}
    />
  );
};
