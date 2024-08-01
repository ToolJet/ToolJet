import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import Select from '@/_ui/Select';
import { operators } from '@/TooljetDatabase/constants';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { isOperatorOptions } from './util';
import CodeHinter from '@/Editor/CodeEditor';
import ButtonComponent from '@/components/ui/Button/Index';

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
      <div className="d-flex mb-2">
        <label className="form-label" data-cy="label-column-filter">
          Filter
        </label>

        <div className="field-container flex-grow-1 col">
          {Object.values(updateRowsOptions?.where_filters || {}).map((filter) => (
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
          <ButtonComponent
            leadingIcon="plus01"
            onClick={addNewFilterConditionPair}
            variant="ghostBrand"
            size="medium"
            className={`cursor-pointer fit-content ${isEmpty(updateRowsOptions?.where_filters) ? '' : 'tw-mt-2'}`}
          >
            Add Condition
          </ButtonComponent>
        </div>
      </div>

      <div className="fields-container d-flex">
        <label className="form-label" data-cy="label-column-filter">
          Columns
        </label>
        <div className="field-container flex-grow-1 col">
          {Object.entries(updateRowsOptions?.columns).map(([key, value]) => {
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
            <ButtonComponent
              leadingIcon="plus01"
              onClick={addNewColumnOptionsPair}
              variant="ghostBrand"
              size="medium"
              className={`cursor-pointer fit-content ${isEmpty(updateRowsOptions?.columns) ? '' : 'tw-mt-2'}`}
            >
              Add column
            </ButtonComponent>
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
}) => {
  let displayColumns = columns.map(({ accessor }) => ({
    value: accessor,
    label: accessor,
  }));

  const handleColumnChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...updateRowsOptions?.where_filters[id], ...{ column: selectedOption } });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...updateRowsOptions?.where_filters[id], ...{ operator: selectedOption } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...updateRowsOptions?.where_filters[id], ...{ value: newValue } });
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
            width="auto"
          />
        </div>
        <div className="field mx-1" style={{ width: '32%' }}>
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
  const filteredColumns = columns.filter(({ column_default }) => !column_default?.startsWith('nextval('));
  const existingColumnOptions = Object.values(updateRowsOptions?.columns).map(({ column }) => column);
  let displayColumns = filteredColumns.map(({ accessor }) => ({
    value: accessor,
    label: accessor,
  }));

  if (existingColumnOptions.length > 0) {
    displayColumns = displayColumns.filter(
      ({ value }) => !existingColumnOptions.map((item) => item !== column && item).includes(value)
    );
  }

  const handleColumnChange = (selectedOption) => {
    const columnOptions = updateRowsOptions?.columns;
    const updatedOption = {
      ...columnOptions[id],
      column: selectedOption,
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
    <div className="mt-1 row-container">
      <div className="d-flex fields-container">
        <div className="field col-4 me-3">
          <Select
            useMenuPortal={true}
            placeholder="Select column"
            value={column}
            options={displayColumns}
            onChange={handleColumnChange}
          />
        </div>

        <div className="field col-6 mx-1">
          <CodeHinter
            type="basic"
            initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
            className="codehinter-plugins"
            placeholder="key"
            onChange={(newValue) => handleValueChange(newValue)}
          />
        </div>

        <div className="col cursor-pointer m-1 mx-3">
          <ButtonComponent
            fill="#E54D2E"
            iconOnly
            leadingIcon="delete"
            onClick={() => removeColumnOptionsPair(id)}
            variant="ghost"
            size="medium"
          />
        </div>
      </div>
    </div>
  );
};
