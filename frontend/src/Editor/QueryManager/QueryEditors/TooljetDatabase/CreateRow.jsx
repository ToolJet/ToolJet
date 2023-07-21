import React, { useState, useEffect, useContext } from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import Select from '@/_ui/Select';
import { uniqueId } from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const CreateRow = React.memo(({ optionchanged, options, darkMode }) => {
  const mounted = useMounted();
  const { columns } = useContext(TooljetDatabaseContext);
  const [columnOptions, setColumnOptions] = useState(options['create_row'] || {});

  useEffect(() => {
    mounted && optionchanged('create_row', columnOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnOptions]);

  function handleColumnOptionChange(columnOptions) {
    setColumnOptions(columnOptions);
  }

  function removeColumnOptionsPair(indexedId) {
    const existingColumnOption = columnOptions || {};

    const updatedOptionsObject = Object.keys(existingColumnOption).reduce((acc, key) => {
      if (key !== indexedId) {
        acc[key] = existingColumnOption[key];
      }

      return acc;
    }, {});

    handleColumnOptionChange(updatedOptionsObject);
  }

  function addNewColumnOptionsPair() {
    if (Object.keys(columnOptions).length === columns.length) {
      return;
    }
    const existingColumnOption = Object.values ? Object.values(columnOptions) : [];
    const emptyColumnOption = { column: '', value: '' };
    handleColumnOptionChange({ ...existingColumnOption, ...{ [uniqueId()]: emptyColumnOption } });
  }

  return (
    <div className="row tj-db-field-wrapper">
      <div className="tab-content-wrapper mt-2">
        <label className="form-label" data-cy="label-column-filter">
          Columns
        </label>

        <div className="field-container">
          {Object.entries(columnOptions).map(([key, value]) => (
            <RenderColumnOptions
              key={key}
              columnOptions={columnOptions}
              column={value.column}
              value={value.value}
              handleColumnOptionChange={handleColumnOptionChange}
              darkMode={darkMode}
              removeColumnOptionsPair={removeColumnOptionsPair}
              id={key}
            />
          ))}

          {Object.keys(columnOptions).length !== columns.length && (
            <ButtonSolid variant="ghostBlue" size="sm" onClick={addNewColumnOptionsPair}>
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

const RenderColumnOptions = ({
  column,
  value,
  id,
  columns,
  columnOptions,
  handleColumnOptionChange,
  darkMode,
  removeColumnOptionsPair,
}) => {
  const filteredColumns = columns.filter(({ isPrimaryKey }) => !isPrimaryKey);
  const existingColumnOption = Object.values ? Object.values(columnOptions) : [];
  let displayColumns = filteredColumns.map(({ accessor }) => ({
    value: accessor,
    label: accessor,
  }));

  if (existingColumnOption.length > 0) {
    displayColumns = displayColumns.filter(
      ({ value }) => !existingColumnOption.map((item) => item.column !== column && item.column).includes(value)
    );
  }

  const handleColumnChange = (selectedOption) => {
    const updatedOption = {
      ...columnOptions[id],
      column: selectedOption,
    };

    const newColumnOptions = { ...columnOptions, [id]: updatedOption };

    handleColumnOptionChange(newColumnOptions);
  };

  const handleValueChange = (newValue) => {
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
        <div className="field col-4">
          <Select
            useMenuPortal={true}
            placeholder="Select column"
            value={column}
            options={displayColumns}
            onChange={handleColumnChange}
            customWrap={true}
          />
        </div>

        <div className="field col-4">
          <CodeHinter
            initialValue={value ? (typeof value === 'string' ? value : JSON.stringify(value)) : value}
            className="codehinter-plugins"
            theme={darkMode ? 'monokai' : 'default'}
            height={'32px'}
            placeholder="key"
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
