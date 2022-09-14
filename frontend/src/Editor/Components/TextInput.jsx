import React, { useEffect, useState, useRef } from 'react';

export const TextInput = function TextInput({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
  registerAction,
  component,
  darkMode,
}) {
  const textInputRef = useRef();

  const [loading, setLoading] = useState(properties.loading);
  useEffect(() => setLoading(properties.loading), [properties.loading]);

  const [disable, setDisable] = useState(properties.disable);
  useEffect(() => setDisable(properties.disable), [properties.disable]);

  const [hidden, setHidden] = useState(properties.hidden);
  useEffect(() => setHidden(properties.hidden), [properties.hidden]);

  const [value, setValue] = useState(properties.value);
  const { isValid, validationError } = validate(value);
  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);
  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  registerAction('setText', async function (text) {
    setValue(text);
    setExposedVariable('value', text).then(fireEvent('onChange'));
  });
  registerAction('clear', async function () {
    setValue('');
    setExposedVariable('value', '').then(fireEvent('onChange'));
  });
  registerAction('setFocus', async function () {
    textInputRef.current.focus();
  });
  registerAction('setBlur', async function () {
    textInputRef.current.blur();
  });
  registerAction('loading', async function (value) {
    setLoading(value);
  });
  registerAction('disable', async function (value) {
    setDisable(value);
  });
  registerAction('hide', async function (value) {
    setHidden(value);
  });

  return (
    <div data-disabled={disable} className={`text-input ${hidden && 'invisible'}`}>
      {loading === true && (
        <div style={{ width: '100%' }}>
          <center>
            <div className="spinner-border" role="status"></div>
          </center>
        </div>
      )}
      {loading || (
        <React.Fragment>
          <input
            ref={textInputRef}
            disabled={styles.disabledState}
            onKeyUp={(e) => {
              if (e.key == 'Enter') {
                setValue(e.target.value);
                setExposedVariable('value', e.target.value).then(() => {
                  fireEvent('onEnterPressed');
                });
              }
            }}
            onChange={(e) => {
              setValue(e.target.value);
              setExposedVariable('value', e.target.value);
              fireEvent('onChange');
            }}
            onMouseEnter={(e) => {
              e.target.focus();
              e.stopPropagation();
              fireEvent('onFocus');
            }}
            onMouseLeave={(e) => {
              e.target.blur();
              e.stopPropagation();
              fireEvent('unFocus');
            }}
            type="text"
            className={`form-control ${!isValid ? 'is-invalid' : ''} validation-without-icon ${
              darkMode && 'dark-theme-placeholder'
            }`}
            placeholder={properties.placeholder}
            style={{ height, display: styles.visibility ? '' : 'none', borderRadius: `${styles.borderRadius}px` }}
            value={value}
            data-cy={`draggable-widget-${component.name}`}
          />
          <div className="invalid-feedback">{validationError}</div>
        </React.Fragment>
      )}
    </div>
  );
};
