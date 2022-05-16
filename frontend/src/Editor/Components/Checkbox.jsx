import React, { useEffect } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const Checkbox = function Checkbox({
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  component,
  currentState,
}) {
  // properties definitions
  const defaultValue = component.definition.properties.defaultValue?.value ?? false;
  const parsedDefaultValue =
    typeof defaultValue !== 'boolean' ? resolveWidgetFieldValue(defaultValue, currentState) : false;

  const [checked, setChecked] = React.useState(defaultValue);
  const { label } = properties;
  const { visibility, disabledState, checkboxColor, textColor } = styles;

  function toggleValue(e) {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    setExposedVariable('value', isChecked);
    if (isChecked) {
      fireEvent('onCheck');
    } else {
      fireEvent('onUnCheck');
    }
  }
  useEffect(() => {
    setExposedVariable('value', parsedDefaultValue);
    setChecked(parsedDefaultValue);
  }, [parsedDefaultValue]);

  return (
    <div data-disabled={disabledState} className="row py-1" style={{ height, display: visibility ? '' : 'none' }}>
      <div className="col px-1 py-0 mt-0">
        <label className="mx-1 form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            onClick={(e) => {
              toggleValue(e);
            }}
            style={{ backgroundColor: checked ? `${checkboxColor}` : 'white', marginTop: '1px' }}
          />
          <span className="form-check-label" style={{ color: textColor }}>
            {label}
          </span>
        </label>
      </div>
    </div>
  );
};
