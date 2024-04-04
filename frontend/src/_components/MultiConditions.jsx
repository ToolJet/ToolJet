import React, { useEffect, useState } from 'react';
import _, { isEmpty } from 'lodash';
import Select from '@/_ui/Select';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { v4 as uuidv4 } from 'uuid';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const ConditionFilter = ({ operators = [], value, onChange, placeholders }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [listRowsOptions, setListRowOptions] = useState({ where_filters: value });

  useEffect(() => {
    onChange(listRowsOptions.where_filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRowsOptions]);

  function handleWhereFiltersChange(filters) {
    setListRowOptions({ where_filters: filters });
  }

  function addNewFilterConditionPair() {
    const existingFilters = listRowsOptions?.where_filters ? Object.values(listRowsOptions?.where_filters) : [];
    const emptyFilter = { column: '', operator: '', value: '' };
    const newFilter = { ...emptyFilter, ...{ id: uuidv4() } };
    handleWhereFiltersChange({ ...existingFilters, ...{ [newFilter.id]: newFilter } });
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

  function removeFilterConditionPair(id) {
    const existingFilters = listRowsOptions?.where_filters ? Object.values(listRowsOptions?.where_filters) : [];
    const updatedFilters = existingFilters.filter((f) => f.id !== id);
    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleWhereFiltersChange(updatedFiltersObject);
  }

  return (
    <div className="d-flex mb-2">
      <div className="field-container flex-grow-1">
        {Object.values(listRowsOptions?.where_filters || {}).map((filter) => (
          <RenderFilterFields
            key={filter.id}
            {...filter}
            listRowsOptions={listRowsOptions}
            updateFilterOptionsChanged={updateFilterOptionsChanged}
            darkMode={darkMode}
            removeFilterConditionPair={removeFilterConditionPair}
            operators={operators}
            placeholders={placeholders}
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
  );
};

export const CondtionSort = ({ orders = [], value, onChange, placeholders }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [listRowsOptions, setListRowOptions] = useState({ order_filters: value });

  useEffect(() => {
    onChange(listRowsOptions.order_filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRowsOptions]);

  function handleOrderFiltersChange(filters) {
    setListRowOptions({ order_filters: filters });
  }

  function addNewSortConditionPair() {
    const existingFilters = listRowsOptions?.order_filters ? Object.values(listRowsOptions?.order_filters) : [];
    const emptyFilter = { column: '', order: '' };
    const newFilter = { ...emptyFilter, ...{ id: uuidv4() } };
    handleOrderFiltersChange({ ...existingFilters, ...{ [newFilter.id]: newFilter } });
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

  function removeSortConditionPair(id) {
    const existingFilters = listRowsOptions?.order_filters ? Object.values(listRowsOptions?.order_filters) : [];
    const updatedFilters = existingFilters.filter((f) => f.id !== id);
    const updatedFiltersObject = updatedFilters.reduce((acc, filter) => {
      acc[filter.id] = filter;
      return acc;
    }, {});

    handleOrderFiltersChange(updatedFiltersObject);
  }

  return (
    <div className="fields-container d-flex mb-2">
      <div className="field-container flex-grow-1">
        {Object.values(listRowsOptions?.order_filters || {}).map((filter) => (
          <RenderSortFields
            key={filter.id}
            {...filter}
            removeSortConditionPair={removeSortConditionPair}
            listRowsOptions={listRowsOptions}
            orders={orders}
            updateSortOptionsChanged={updateSortOptionsChanged}
            darkMode={darkMode}
            placeholders={placeholders}
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
  );
};

export const MultiColumn = ({ value, onChange, placeholders }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [updateRowsOptions, setUpdateRowsOptions] = useState({ columns: value });

  useEffect(() => {
    onChange(updateRowsOptions.columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateRowsOptions]);

  function handleColumnOptionChange(columnOptions) {
    setUpdateRowsOptions({ columns: columnOptions });
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
    const existingColumnOption = Object.values ? Object.values(updateRowsOptions?.columns) : [];
    const emptyColumnOption = { column: '', value: '' };
    handleColumnOptionChange({ ...existingColumnOption, ...{ [uuidv4()]: emptyColumnOption } });
  }

  return (
    <div className="fields-container d-flex">
      <div className="field-container flex-grow-1">
        {Object.entries(updateRowsOptions?.columns).map(([key, value]) => {
          return (
            <RenderColumnOptions
              key={key}
              column={value.column}
              value={value.value}
              id={key}
              updateRowsOptions={updateRowsOptions}
              handleColumnOptionChange={handleColumnOptionChange}
              darkMode={darkMode}
              placeholders={placeholders}
              removeColumnOptionsPair={removeColumnOptionsPair}
            />
          );
        })}

        <ButtonSolid
          variant="ghostBlue"
          size="sm"
          onClick={addNewColumnOptionsPair}
          className={`cursor-pointer fit-content ${isEmpty(updateRowsOptions?.columns) ? '' : 'mt-2'}`}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
              fill="#466BF2"
            />
          </svg>
          &nbsp; Add column
        </ButtonSolid>
      </div>
    </div>
  );
};

const RenderSortFields = ({
  column,
  order,
  orders,
  darkMode,
  placeholders,
  id,
  removeSortConditionPair,
  listRowsOptions,
  updateSortOptionsChanged,
}) => {
  const handleColumnChange = (newValue) => {
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ column: newValue } });
  };

  const handleDirectionChange = (selectedOption) => {
    updateSortOptionsChanged({ ...listRowsOptions?.order_filters[id], ...{ order: selectedOption } });
  };

  return (
    <div className="mt-1 row-container">
      <div className="d-flex fields-container mb-2">
        <div className="field col">
          <CodeHinter
            initialValue={column ? (typeof column === 'string' ? column : JSON.stringify(column)) : column}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'40px'}
            placeholder={placeholders.columnKey}
            onChange={(newValue) => handleColumnChange(newValue)}
          />
        </div>
        <div className="field col mx-1">
          <Select
            useMenuPortal={true}
            placeholder={placeholders.order}
            value={order}
            options={orders}
            height={'40px'}
            width={'auto'}
            onChange={handleDirectionChange}
          />
        </div>
        <div className="col cursor-pointer m-1 ms-1">
          <svg
            onClick={() => removeSortConditionPair(id)}
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.72386 0.884665C3.97391 0.634616 4.31304 0.494141 4.66667 0.494141H7.33333C7.68696 0.494141 8.02609 0.634616 8.27614 0.884665C8.52619 1.13471 8.66667 1.47385 8.66667 1.82747V3.16081H10.6589C10.6636 3.16076 10.6683 3.16076 10.673 3.16081H11.3333C11.7015 3.16081 12 3.45928 12 3.82747C12 4.19566 11.7015 4.49414 11.3333 4.49414H11.2801L10.6664 11.858C10.6585 12.3774 10.4488 12.8738 10.0809 13.2417C9.70581 13.6168 9.1971 13.8275 8.66667 13.8275H3.33333C2.8029 13.8275 2.29419 13.6168 1.91912 13.2417C1.55125 12.8738 1.34148 12.3774 1.33357 11.858L0.719911 4.49414H0.666667C0.298477 4.49414 0 4.19566 0 3.82747C0 3.45928 0.298477 3.16081 0.666667 3.16081H1.32702C1.33174 3.16076 1.33644 3.16076 1.34113 3.16081H3.33333V1.82747C3.33333 1.47385 3.47381 1.13471 3.72386 0.884665ZM2.05787 4.49414L2.66436 11.7721C2.6659 11.7905 2.66667 11.809 2.66667 11.8275C2.66667 12.0043 2.7369 12.1739 2.86193 12.2989C2.98695 12.4239 3.15652 12.4941 3.33333 12.4941H8.66667C8.84348 12.4941 9.01305 12.4239 9.13807 12.2989C9.2631 12.1739 9.33333 12.0043 9.33333 11.8275C9.33333 11.809 9.3341 11.7905 9.33564 11.7721L9.94213 4.49414H2.05787ZM7.33333 3.16081H4.66667V1.82747H7.33333V3.16081ZM4.19526 7.63221C3.93491 7.37186 3.93491 6.94975 4.19526 6.6894C4.45561 6.42905 4.87772 6.42905 5.13807 6.6894L6 7.55133L6.86193 6.6894C7.12228 6.42905 7.54439 6.42905 7.80474 6.6894C8.06509 6.94975 8.06509 7.37186 7.80474 7.63221L6.94281 8.49414L7.80474 9.35607C8.06509 9.61642 8.06509 10.0385 7.80474 10.2989C7.54439 10.5592 7.12228 10.5592 6.86193 10.2989L6 9.43695L5.13807 10.2989C4.87772 10.5592 4.45561 10.5592 4.19526 10.2989C3.93491 10.0385 3.93491 9.61642 4.19526 9.35607L5.05719 8.49414L4.19526 7.63221Z"
              fill="#E54D2E"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const RenderFilterFields = ({
  operator,
  column,
  value,
  id,
  listRowsOptions,
  updateFilterOptionsChanged,
  removeFilterConditionPair,
  darkMode,
  operators,
  placeholders,
}) => {
  const handleColumnChange = (newValue) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ column: newValue } });
  };

  const handleOperatorChange = (selectedOption) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ operator: selectedOption } });
  };

  const handleValueChange = (newValue) => {
    updateFilterOptionsChanged({ ...listRowsOptions?.where_filters[id], ...{ value: newValue } });
  };

  return (
    <div className="mt-1 row-container">
      <div className="d-flex fields-container">
        <div className="field col">
          <CodeHinter
            initialValue={column ? (typeof column === 'string' ? column : JSON.stringify(column)) : column}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'40px'}
            placeholder={placeholders.columnKey}
            onChange={(newValue) => handleColumnChange(newValue)}
          />
        </div>
        <div className="field col mx-1">
          <Select
            useMenuPortal={true}
            placeholder={placeholders.operator}
            value={operator}
            options={operators}
            height={'40px'}
            onChange={handleOperatorChange}
            width={'auto'}
          />
        </div>
        <div className="field col-4">
          <CodeHinter
            initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'40px'}
            placeholder={placeholders.value}
            onChange={(newValue) => handleValueChange(newValue)}
          />
        </div>
        <div className="col-1 cursor-pointer m-1 mr-2">
          <svg
            onClick={() => removeFilterConditionPair(id)}
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.72386 0.884665C3.97391 0.634616 4.31304 0.494141 4.66667 0.494141H7.33333C7.68696 0.494141 8.02609 0.634616 8.27614 0.884665C8.52619 1.13471 8.66667 1.47385 8.66667 1.82747V3.16081H10.6589C10.6636 3.16076 10.6683 3.16076 10.673 3.16081H11.3333C11.7015 3.16081 12 3.45928 12 3.82747C12 4.19566 11.7015 4.49414 11.3333 4.49414H11.2801L10.6664 11.858C10.6585 12.3774 10.4488 12.8738 10.0809 13.2417C9.70581 13.6168 9.1971 13.8275 8.66667 13.8275H3.33333C2.8029 13.8275 2.29419 13.6168 1.91912 13.2417C1.55125 12.8738 1.34148 12.3774 1.33357 11.858L0.719911 4.49414H0.666667C0.298477 4.49414 0 4.19566 0 3.82747C0 3.45928 0.298477 3.16081 0.666667 3.16081H1.32702C1.33174 3.16076 1.33644 3.16076 1.34113 3.16081H3.33333V1.82747C3.33333 1.47385 3.47381 1.13471 3.72386 0.884665ZM2.05787 4.49414L2.66436 11.7721C2.6659 11.7905 2.66667 11.809 2.66667 11.8275C2.66667 12.0043 2.7369 12.1739 2.86193 12.2989C2.98695 12.4239 3.15652 12.4941 3.33333 12.4941H8.66667C8.84348 12.4941 9.01305 12.4239 9.13807 12.2989C9.2631 12.1739 9.33333 12.0043 9.33333 11.8275C9.33333 11.809 9.3341 11.7905 9.33564 11.7721L9.94213 4.49414H2.05787ZM7.33333 3.16081H4.66667V1.82747H7.33333V3.16081ZM4.19526 7.63221C3.93491 7.37186 3.93491 6.94975 4.19526 6.6894C4.45561 6.42905 4.87772 6.42905 5.13807 6.6894L6 7.55133L6.86193 6.6894C7.12228 6.42905 7.54439 6.42905 7.80474 6.6894C8.06509 6.94975 8.06509 7.37186 7.80474 7.63221L6.94281 8.49414L7.80474 9.35607C8.06509 9.61642 8.06509 10.0385 7.80474 10.2989C7.54439 10.5592 7.12228 10.5592 6.86193 10.2989L6 9.43695L5.13807 10.2989C4.87772 10.5592 4.45561 10.5592 4.19526 10.2989C3.93491 10.0385 3.93491 9.61642 4.19526 9.35607L5.05719 8.49414L4.19526 7.63221Z"
              fill="#E54D2E"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const RenderColumnOptions = ({
  column,
  value,
  id,
  placeholders,
  updateRowsOptions,
  handleColumnOptionChange,
  darkMode,
  removeColumnOptionsPair,
}) => {
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
          <CodeHinter
            initialValue={column ? (typeof column === 'string' ? column : JSON.stringify(column)) : column}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder={placeholders.columnKey}
            onChange={(newValue) => handleColumnChange(newValue)}
          />
        </div>

        <div className="field col-6 mx-1">
          <CodeHinter
            initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder={placeholders.value}
            onChange={(newValue) => handleValueChange(newValue)}
          />
        </div>

        <div className="col cursor-pointer m-1 mx-3">
          <svg
            onClick={() => {
              removeColumnOptionsPair(id);
            }}
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.72386 0.884665C3.97391 0.634616 4.31304 0.494141 4.66667 0.494141H7.33333C7.68696 0.494141 8.02609 0.634616 8.27614 0.884665C8.52619 1.13471 8.66667 1.47385 8.66667 1.82747V3.16081H10.6589C10.6636 3.16076 10.6683 3.16076 10.673 3.16081H11.3333C11.7015 3.16081 12 3.45928 12 3.82747C12 4.19566 11.7015 4.49414 11.3333 4.49414H11.2801L10.6664 11.858C10.6585 12.3774 10.4488 12.8738 10.0809 13.2417C9.70581 13.6168 9.1971 13.8275 8.66667 13.8275H3.33333C2.8029 13.8275 2.29419 13.6168 1.91912 13.2417C1.55125 12.8738 1.34148 12.3774 1.33357 11.858L0.719911 4.49414H0.666667C0.298477 4.49414 0 4.19566 0 3.82747C0 3.45928 0.298477 3.16081 0.666667 3.16081H1.32702C1.33174 3.16076 1.33644 3.16076 1.34113 3.16081H3.33333V1.82747C3.33333 1.47385 3.47381 1.13471 3.72386 0.884665ZM2.05787 4.49414L2.66436 11.7721C2.6659 11.7905 2.66667 11.809 2.66667 11.8275C2.66667 12.0043 2.7369 12.1739 2.86193 12.2989C2.98695 12.4239 3.15652 12.4941 3.33333 12.4941H8.66667C8.84348 12.4941 9.01305 12.4239 9.13807 12.2989C9.2631 12.1739 9.33333 12.0043 9.33333 11.8275C9.33333 11.809 9.3341 11.7905 9.33564 11.7721L9.94213 4.49414H2.05787ZM7.33333 3.16081H4.66667V1.82747H7.33333V3.16081ZM4.19526 7.63221C3.93491 7.37186 3.93491 6.94975 4.19526 6.6894C4.45561 6.42905 4.87772 6.42905 5.13807 6.6894L6 7.55133L6.86193 6.6894C7.12228 6.42905 7.54439 6.42905 7.80474 6.6894C8.06509 6.94975 8.06509 7.37186 7.80474 7.63221L6.94281 8.49414L7.80474 9.35607C8.06509 9.61642 8.06509 10.0385 7.80474 10.2989C7.54439 10.5592 7.12228 10.5592 6.86193 10.2989L6 9.43695L5.13807 10.2989C4.87772 10.5592 4.45561 10.5592 4.19526 10.2989C3.93491 10.0385 3.93491 9.61642 4.19526 9.35607L5.05719 8.49414L4.19526 7.63221Z"
              fill="#E54D2E"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
