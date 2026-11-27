import { Button as RadixButton } from '@/components/ui/Button/Button';
import React from 'react';
import { useToolJetDbOperationsContext } from './ToolJetDbOperationsContext';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { operators } from '@/_helpers/constants';
import { isOperatorOptions, resolveColumnDisplayName, columnIdOf } from './util';
import CodeHinter from '@/AppBuilder/CodeEditor';
import RenderFilterSectionUI from './RenderFilterSectionUI';
import { NoCondition } from './NoConditionUI';

export const DeleteRows = React.memo(({ darkMode }) => {
  const { columns, deleteOperationLimitOptionChanged, deleteRowsOptions, handleDeleteRowsOptionsChange } =
    useToolJetDbOperationsContext();

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
    <div className="tab-content-wrapper tj-db-field-wrapper mt-2 tooljetdb-operation-form">
      <div className="d-flex tooljetdb-worflow-operations">
        <label className="form-label flex-shrink-0" data-cy="label-column-filter">
          Filter
        </label>

        <div className="field-container flex-grow-1  mb-2 col">
          {isEmpty(deleteRowsOptions?.where_filters || {}) && <NoCondition />}
          {!isEmpty(deleteRowsOptions?.where_filters || {}) &&
            Object.values(deleteRowsOptions?.where_filters || {}).map((filter) => (
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

          <RadixButton
            isLucid
            size="medium"
            variant="outline"
            leadingIcon="plus"
            onClick={() => {
              addNewFilterConditionPair();
            }}
            className={isEmpty(deleteRowsOptions?.where_filters || {}) ? '' : 'mt-2'}
          >
            Add Condition
          </RadixButton>
        </div>
      </div>
      <div className="field-container d-flex tooljetdb-worflow-operations delete-limit">
        <label className="form-label flex-shrink-0" data-cy="label-column-limit">
          Limit
        </label>
        <div className="field flex-grow-1 minw-400-w-400 tjdb-limit-offset-codehinter">
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
  columnId,
  operator,
  value,
  id,
  removeFilterConditionPair,
  columns,
  updateFilterOptionsChanged,
  deleteRowsOptions,
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
      ...deleteRowsOptions?.where_filters[id],
      ...{
        column: selectedOption.value,
        columnId: columnIdOf(selectedOption),
        columnDataType: selectedOption?.dataType || '',
      },
    });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...deleteRowsOptions?.where_filters[id], ...{ operator: selectedOption.value } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...deleteRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  const handleJsonPathChange = (value) => {
    updateFilterOptionsChanged({
      ...deleteRowsOptions?.where_filters[id],
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
