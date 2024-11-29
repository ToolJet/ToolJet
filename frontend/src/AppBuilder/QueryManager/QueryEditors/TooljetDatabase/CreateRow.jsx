import React, { useState, useEffect, useContext, useRef } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import _, { isEmpty } from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import RenderColumnUI from './RenderColumnUI';
import { NoCondition } from './NoConditionUI';
import cx from 'classnames';

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
    const existingColumnOption = columnOptions || {};
    const emptyColumnOption = { column: '', value: '' };
    handleColumnOptionChange({ ...existingColumnOption, ...{ [uuidv4()]: emptyColumnOption } });
  }

  return (
    <div className="row tj-db-field-wrapper">
      <div className="tab-content-wrapper d-flex tooljetdb-worflow-operations" style={{ marginTop: '16px' }}>
        <label className="form-label flex-shrink-0" data-cy="label-column-filter">
          Columns
        </label>

        <div className={`field-container flex-grow-1  d-flex custom-gap-6 flex-column`}>
          {isEmpty(columnOptions) && <NoCondition text="There are no columns" />}
          {!isEmpty(columnOptions) &&
            Object.entries(columnOptions).map(([key, value]) => (
              <RenderColumnOptions
                key={key}
                columnOptions={columnOptions}
                column={value.column}
                columns={columns}
                value={value.value}
                handleColumnOptionChange={handleColumnOptionChange}
                darkMode={darkMode}
                removeColumnOptionsPair={removeColumnOptionsPair}
                id={key}
              />
            ))}

          {Object.keys(columnOptions).length !== columns.length && (
            <ButtonSolid
              variant="ghostBlue"
              size="sm"
              onClick={addNewColumnOptionsPair}
              className="d-flex justify-content-start width-fit-content"
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
  const filteredColumns = columns.filter(({ column_default }) =>
    _.isObject(column_default) ? true : !column_default?.startsWith('nextval(')
  );
  const existingColumnOption = Object.values ? Object.values(columnOptions) : [];
  let displayColumns = filteredColumns.map(({ accessor, dataType }) => ({
    value: accessor,
    label: accessor,
    icon: dataType,
  }));

  if (existingColumnOption.length > 0) {
    displayColumns = displayColumns.filter(
      ({ value }) => !existingColumnOption.map((item) => item.column !== column && item.column).includes(value)
    );
  }

  const handleColumnChange = (selectedOption) => {
    const updatedOption = {
      ...columnOptions[id],
      column: selectedOption.value,
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
  const currentColumnType = columns?.find((columnDetails) => columnDetails.accessor === column)?.dataType;

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
