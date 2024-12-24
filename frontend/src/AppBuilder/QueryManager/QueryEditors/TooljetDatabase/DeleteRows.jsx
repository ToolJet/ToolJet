import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { operators } from '@/TooljetDatabase/constants';
import { isOperatorOptions } from './util';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import RenderFilterSectionUI from './RenderFilterSectionUI';
import { NoCondition } from './NoConditionUI';

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

          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            onClick={() => {
              addNewFilterConditionPair();
            }}
            className={isEmpty(deleteRowsOptions?.where_filters || {}) ? '' : 'mt-2'}
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
  let displayColumns = columns.map(({ accessor, dataType }) => ({
    value: accessor,
    label: accessor,
    icon: dataType,
  }));

  operator = operators.find((val) => val.value === operator);

  const handleColumnChange = (selectedOption) => {
    updateFilterOptionsChanged({
      ...deleteRowsOptions?.where_filters[id],
      ...{ column: selectedOption.value, columnDataType: selectedOption?.dataType || '' },
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

  const isSelectedColumnJsonbType = columns.find((col) => col.accessor === column)?.dataType === 'jsonb';

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
      isSelectedColumnJsonbType={isSelectedColumnJsonbType}
      handleJsonPathChange={handleJsonPathChange}
      jsonpath={jsonpath}
    />
  );
};
