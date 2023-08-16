import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const RadioButton = function RadioButton({
  id,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  darkMode,
  dataCy,
}) {
  const { label, value, values, display_values } = properties;
  const { visibility, disabledState, activeColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [checkedValue, setValue] = useState(() => value);
  useEffect(() => setValue(value), [value]);

  let selectOptions = [];

  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { name: display_values[index], value: value };
      }),
    ];
  } catch (err) {
    console.log(err);
  }

  function onSelect(selection) {
    setValue(selection);
    setExposedVariable('value', selection).then(() => fireEvent('onSelectionChange'));
  }

  useEffect(() => {
    const exposedVariables = {
      value,
      selectOption: async function (option) {
        onSelect(option);
      },
    };

    setExposedVariable('allVariables', exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, setValue]);

  return (
    <div
      data-disabled={disabledState}
      className="row py-1"
      style={{ height, display: visibility ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      <span className="form-check-label col-auto py-0" style={{ color: textColor }}>
        {label}
      </span>
      <div className="col px-1 py-0 mt-0">
        {selectOptions.map((option, index) => (
          <label key={index} className="form-check form-check-inline">
            <input
              style={{
                marginTop: '1px',
                backgroundColor: checkedValue === option.value ? `${activeColor}` : 'white',
              }}
              className="form-check-input"
              checked={checkedValue === option.value}
              type="radio"
              value={option.value}
              name={`${id}-${uuidv4()}`}
              onChange={() => onSelect(option.value)}
            />
            <span className="form-check-label" style={{ color: textColor }}>
              {option.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
