import React, { useState, useEffect, useContext } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import Select from '@/_ui/Select';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import CodeHinter from '@/Editor/CodeEditor';
import ButtonComponent from '@/components/ui/Button/Index';


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
    handleColumnOptionChange({ ...existingColumnOption, ...{ [uuidv4()]: emptyColumnOption } });
  }

  return (
    <div className="row tj-db-field-wrapper">
      <div className="tab-content-wrapper d-flex" style={{ marginTop: '16px' }}>
        <label className="form-label" data-cy="label-column-filter">
          Columns
        </label>

        <div className="field-container flex-grow-1 col">
          {Object.entries(columnOptions).map(([key, value]) => (
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
            <ButtonComponent
              leadingIcon="plus01"
              onClick={addNewColumnOptionsPair}
              variant="ghostBrand"
              className={isEmpty(columnOptions) ? '' : 'tw-mt-2'}
              size="medium"
            >
              Add Condition
            </ButtonComponent>
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
  const filteredColumns = columns.filter(({ column_default }) => !column_default?.startsWith('nextval('));
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
