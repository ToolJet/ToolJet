import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { operators } from '@/TooljetDatabase/constants';
import { v4 as uuidv4 } from 'uuid';
import _, { isEmpty } from 'lodash';
import { isOperatorOptions } from './util';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import RenderFilterSectionUI from './RenderFilterSectionUI';
import RenderColumnUI from './RenderColumnUI';
import { NoCondition } from './NoConditionUI';
import cx from 'classnames';

export const UpdateRows = React.memo(({ darkMode }) => {
  const { columns, updateRowsOptions, handleUpdateRowsOptionsChange } = useContext(TooljetDatabaseContext);

  function handleColumnOptionChange(columnOptions) {
    handleUpdateRowsOptionsChange('columns', columnOptions);
  }
  function removeColumnOptionsPair(indexedId) {
    const existingColumnOption = updateRowsOptions?.columns || {};

    const updatedOptionsObject = Object.keys(existingColumnOption).reduce((acc, key) => {
      if (key !== indexedId) {
        acc[key] = existingColumnOption[key];
      }

      return acc;
    }, {});

    handleColumnOptionChange(updatedOptionsObject);
  }

  function addNewColumnOptionsPair() {
    if (Object.keys(updateRowsOptions?.columns).length === columns.length) {
      return;
    }

    const existingColumnOption = Object.values ? Object.values(updateRowsOptions?.columns) : [];
    const emptyColumnOption = { column: '', value: '' };
    handleColumnOptionChange({ ...existingColumnOption, ...{ [uuidv4()]: emptyColumnOption } });
  }

  function handleWhereFiltersChange(filters) {
    handleUpdateRowsOptionsChange('where_filters', filters);
  }

  function addNewFilterConditionPair() {
    const existingFilters = updateRowsOptions?.where_filters ? Object.values(updateRowsOptions?.where_filters) : [];
    const emptyFilter = { column: '', operator: '', value: '' };
    const newFilter = { ...emptyFilter, ...{ id: uuidv4() } };
    handleWhereFiltersChange({ ...existingFilters, ...{ [newFilter.id]: newFilter } });
  }

  function removeFilterConditionPair(id) {
    const existingFilters = updateRowsOptions?.where_filters ? Object.values(updateRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.filter((f) => f.id !== id);
    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  function updateFilterOptionsChanged(filter) {
    const existingFilters = updateRowsOptions?.where_filters ? Object.values(updateRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.map((f) => (f.id === filter.id ? filter : f));

    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  return (
    <div className="tab-content-wrapper tj-db-field-wrapper mt-2">
      <div className="d-flex tooljetdb-worflow-operations mb-2">
        <label className="form-label flex-shrink-0" data-cy="label-column-filter">
          Filter
        </label>

        <div className="field-container flex-grow-1 col">
          {isEmpty(updateRowsOptions?.where_filters || {}) && <NoCondition />}
          {!isEmpty(updateRowsOptions?.where_filters) &&
            Object.values(updateRowsOptions?.where_filters || {}).map((filter) => (
              <RenderFilterFields
                key={filter.id}
                {...filter}
                columns={columns}
                updateFilterOptionsChanged={updateFilterOptionsChanged}
                updateRowsOptions={updateRowsOptions}
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
            className={`cursor-pointer fit-content ${isEmpty(updateRowsOptions?.where_filters) ? '' : 'mt-2'}`}
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

      <div className="fields-container d-flex tooljetdb-worflow-operations">
        <label className="form-label flex-shrink-0" data-cy="label-column-filter">
          Columns
        </label>
        <div
          className={`field-container flex-grow-1  d-flex custom-gap-6 flex-column ${
            !isEmpty(updateRowsOptions?.columns) && 'minw-400-w-400'
          }`}
        >
          {isEmpty(updateRowsOptions?.columns) && <NoCondition text="There are no columns" />}
          {!isEmpty(updateRowsOptions?.columns) &&
            Object.entries(updateRowsOptions?.columns).map(([key, value]) => {
              return (
                <RenderColumnOptions
                  key={key}
                  column={value.column}
                  value={value.value}
                  id={key}
                  columns={columns}
                  updateRowsOptions={updateRowsOptions}
                  handleColumnOptionChange={handleColumnOptionChange}
                  darkMode={darkMode}
                  removeColumnOptionsPair={removeColumnOptionsPair}
                />
              );
            })}

          {Object.keys(updateRowsOptions?.columns).length !== columns.length && (
            <ButtonSolid
              variant="ghostBlue"
              size="sm"
              onClick={addNewColumnOptionsPair}
              className="d-flex justify-content-start width-fit-content cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
                  fill="#466BF2"
                />
              </svg>
              &nbsp; Add column
            </ButtonSolid>
          )}
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
  columns,
  updateFilterOptionsChanged,
  updateRowsOptions,
  darkMode,
  removeFilterConditionPair,
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
      ...updateRowsOptions?.where_filters[id],
      ...{ column: selectedOption.value },
    });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...updateRowsOptions?.where_filters[id], ...{ operator: selectedOption.value } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...updateRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  const handleJsonPathChange = (value) => {
    updateFilterOptionsChanged({
      ...updateRowsOptions?.where_filters[id],
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
      handleJsonPathChange={handleJsonPathChange}
      isSelectedColumnJsonbType={isSelectedColumnJsonbType}
      jsonpath={jsonpath}
    />
  );
};

const RenderColumnOptions = ({
  column,
  value,
  id,
  columns,
  updateRowsOptions,
  handleColumnOptionChange,
  darkMode,
  removeColumnOptionsPair,
}) => {
  const filteredColumns = columns.filter(({ column_default }) =>
    _.isObject(column_default) ? true : !column_default?.startsWith('nextval(')
  );

  const existingColumnOptions = Object.values(updateRowsOptions?.columns).map(({ column }) => column);
  let displayColumns = filteredColumns.map(({ accessor, dataType }) => ({
    value: accessor,
    label: accessor,
    icon: dataType,
  }));

  const currentColumnType = columns?.find((columnDetails) => columnDetails.accessor === column)?.dataType;

  if (existingColumnOptions.length > 0) {
    displayColumns = displayColumns.filter(
      ({ value }) => !existingColumnOptions.map((item) => item !== column && item).includes(value)
    );
  }

  const handleColumnChange = (selectedOption) => {
    const columnOptions = updateRowsOptions?.columns;
    const updatedOption = {
      ...columnOptions[id],
      column: selectedOption.value,
    };

    const newColumnOptions = { ...columnOptions, [id]: updatedOption };
    handleColumnOptionChange(newColumnOptions);
  };

  const handleValueChange = (newValue) => {
    const columnOptions = updateRowsOptions?.columns;
    const updatedOption = {
      ...columnOptions[id],
      value: newValue,
    };

    const newColumnOptions = { ...columnOptions, [id]: updatedOption };

    handleColumnOptionChange(newColumnOptions);
  };

  return (
    <RenderColumnUI
      column={column}
      displayColumns={displayColumns}
      handleColumnChange={handleColumnChange}
      darkMode={darkMode}
      value={value}
      handleValueChange={handleValueChange}
      removeColumnOptionsPair={removeColumnOptionsPair}
      id={id}
      currentColumnType={currentColumnType}
    />
  );
};
