import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './radioButton.scss';

export const RadioButton = function RadioButton({
  id,
  height,
  width,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  dataCy,
  component,
  validate,
  adjustHeightBasedOnAlignment,
}) {
  const {
    label,
    value,
    values,
    display_values,
    disabledState,
    optionVisibility,
    optionDisable,
    advanced,
    schema,
    optionsLoadingState,
    loadingState,
  } = properties;
  const {
    activeColor,
    boxShadow,
    labelAlignment,
    direction,
    optionTextColor,
    switchOffBorderColor,
    switchOffBackgroundColor,
    switchOnBorderColor,
    handleColor,
    optionAlignment,
  } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [checkedValue, setValue] = useState(() => value);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const validationData = validate(checkedValue);
  const { isValid, validationError } = validationData;

  useEffect(() => setValue(value), [value]);

  const selectOptions = useMemo(() => {
    let _selectOptions = advanced
      ? [
          ...schema
            .filter((data) => data.visible)
            .map((value) => ({
              ...value,
              isDisabled: value.disable,
            })),
        ]
      : [
          ...values
            .map((value, index) => {
              if (optionVisibility[index]) {
                return { label: display_values[index], value: value, isDisabled: optionDisable[index] };
              }
            })
            .filter((option) => option),
        ];

    return _selectOptions;
  }, [advanced, schema, display_values, values, optionDisable, optionVisibility]);

  function onSelect(selection) {
    setValue(selection);
    setExposedVariable('value', selection);
    fireEvent('onSelectionChange');
  }

  function deselectOption() {
    setValue(null);
    setExposedVariable('value', null);
    fireEvent('onSelectionChange');
  }

  useEffect(() => {
    const exposedVariables = {
      value: value,
      selectOption: async function (option) {
        onSelect(option);
      },
      deselectOption: async function () {
        deselectOption();
      },
    };
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, setValue]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setIsLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  useEffect(() => {
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', loadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);
    setExposedVariable('label', label);
    setExposedVariable('options', selectOptions);
    setExposedVariable('isValid', isValid);
    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });
    setExposedVariable('setLoading', async function (value) {
      setIsLoading(value);
    });
    setExposedVariable('setDisabled', async function (value) {
      setIsDisabled(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState, isMandatory, label, isValid]);

  useEffect(() => {
    const radioGroupHeight = document.getElementById('tj-widget-radio-group').offsetHeight;
    adjustHeightBasedOnAlignment(radioGroupHeight - height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionAlignment, selectOptions, width]);

  if (loadingState) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ width: '100%', height }}>
        <center>
          <div className="spinner-border" role="status"></div>
        </center>
      </div>
    );
  }

  return (
    <div
      data-disabled={disabledState}
      className="py-1"
      style={{
        height,
        display: visibility ? '' : 'none',
        boxShadow,
      }}
      data-cy={dataCy}
    >
      <div
        id="tj-widget-radio-group"
        style={{
          display: labelAlignment === 'top' ? 'block' : 'flex',
          flexDirection: labelAlignment === 'side' && direction === 'alignRight' ? 'row-reverse' : 'row',
          justifyContent: direction === 'alignRight' ? 'space-between' : 'flex-start',
        }}
      >
        <span
          className="px-1 form-check-label py-0"
          style={{
            color: textColor,
            textAlign: labelAlignment === 'top' && direction === 'alignRight' ? 'right' : 'start',
          }}
        >
          {label}
          <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
        </span>
        <div className="px-1 py-0 mt-0">
          {optionsLoadingState ? (
            <div className="d-flex align-items-center justify-content-center" style={{ width: '100%', height }}>
              <center>
                <div className="spinner-border" role="status"></div>
              </center>
            </div>
          ) : (
            selectOptions.map((option, index) => {
              const isChecked = checkedValue == option.value;
              return (
                <label
                  key={index}
                  className="radio-button-container"
                  style={{ display: optionAlignment === 'horizontal' ? 'inline-block' : 'block' }}
                >
                  <span style={{ color: optionTextColor ? optionTextColor : textColor }}>{option.label}</span>
                  <input
                    style={{
                      marginTop: '1px',
                      backgroundColor: checkedValue === option.value ? `${activeColor}` : 'white',
                    }}
                    checked={checkedValue == option.value}
                    type="radio"
                    value={option.value}
                    name={`${id}-${uuidv4()}`}
                    onChange={() => onSelect(option.value)}
                    disabled={option.isDisabled}
                  />
                  <span
                    className="checkmark"
                    style={{
                      backgroundColor: !isChecked && switchOffBackgroundColor,
                      borderColor: !isChecked && switchOffBorderColor,
                      '--selected-background-color': activeColor,
                      '--selected-border-color': switchOnBorderColor,
                      '--selected-handle-color': handleColor,
                    }}
                  ></span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
