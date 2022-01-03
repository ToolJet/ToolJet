import React, { useEffect } from 'react';

export const RadioButton = function RadioButton({
  id,
  height,
  properties,
  styles,
  fireEvent,
  exposedVariables,
  setExposedVariable,
}) {
  const { label, value, values, display_values } = properties;
  const { visibility, disabledState, textColor, activeColor } = styles;
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
    setExposedVariable('value', selection);
    fireEvent('onSelectionChange');
  }

  useEffect(() => {
    setExposedVariable('value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div data-disabled={disabledState} className="row py-1" style={{ height, display: visibility ? '' : 'none' }}>
      <span className="form-check-label col-auto py-0" style={{ color: textColor }}>
        {label}
      </span>
      <div className="col px-1 py-0 mt-0">
        {selectOptions.map((option, index) => (
          <label key={index} className="form-check form-check-inline">
            <input
              style={{
                marginTop: '1px',
                backgroundColor: exposedVariables.value === option.value ? `${activeColor}` : 'white',
              }}
              className="form-check-input"
              checked={exposedVariables.value === option.value}
              type="radio"
              value={option.value}
              name={`${id}-radio-options`}
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
