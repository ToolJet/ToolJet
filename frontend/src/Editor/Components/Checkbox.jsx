import React, { useEffect } from 'react';

export const Checkbox = function Checkbox({
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  registerAction,
  darkMode,
  dataCy,
}) {
  const defaultValueFromProperties = properties.defaultValue ?? false;
  const [defaultValue, setDefaultvalue] = React.useState(defaultValueFromProperties);
  const [checked, setChecked] = React.useState(defaultValueFromProperties);
  const { label } = properties;
  const { visibility, disabledState, checkboxColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;

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
    setExposedVariable('value', defaultValueFromProperties);
    setDefaultvalue(defaultValueFromProperties);
    setChecked(defaultValueFromProperties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValueFromProperties]);

  registerAction(
    'setChecked',
    async function (status) {
      setExposedVariable('value', status).then(() => (status ? fireEvent('onCheck') : fireEvent('onUnCheck')));
      setChecked(status);
    },
    [setChecked]
  );

  return (
    <div
      data-disabled={disabledState}
      className="row py-1"
      style={{ height, display: visibility ? '' : 'none', boxShadow }}
      data-cy={dataCy}
    >
      <div className="col px-1 py-0 mt-0">
        <label className="mx-1 form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            onClick={(e) => {
              toggleValue(e);
            }}
            defaultChecked={defaultValue}
            checked={checked}
            style={{
              backgroundColor: checked ? `${checkboxColor}` : 'white',
              marginTop: '1px',
            }}
          />
          <span
            className="form-check-label"
            style={{ color: textColor }}
          >
            {label}
          </span>
        </label>
      </div>
    </div>
  );
};
