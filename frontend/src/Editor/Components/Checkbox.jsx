import React, { useEffect, useRef, useState } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import OverflowTooltip from '@/_components/OverflowTooltip';

export const Checkbox = ({
  height,
  properties,
  styles,
  fireEvent,
  componentName,
  setExposedVariable,
  setExposedVariables,
  validation,
  dataCy,
  validate,
  width,
}) => {
  const isInitialRender = useRef(true);
  const defaultValueFromProperties = properties.defaultValue ?? false;
  const isMandatory = validation?.mandatory ?? false;
  const [defaultValue, setDefaultValue] = useState(defaultValueFromProperties);
  const [checked, setChecked] = useState(defaultValueFromProperties);
  const [userInteracted, setUserInteracted] = useState(false);

  const { label } = properties;
  const textColor = ['#1B1F24', '#000', '#000000ff'].includes(styles.textColor)
    ? 'var(--text-primary)'
    : styles.textColor;
  const { loadingState, disabledState } = properties;
  const { checkboxColor, boxShadow, alignment, uncheckedColor, borderColor, handleColor } = styles;

  const [loading, setLoading] = useState(properties?.loadingState);
  const [disable, setDisable] = useState(disabledState || loadingState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [validationStatus, setValidationStatus] = useState(validate(checked));
  const { isValid, validationError } = validationStatus;

  const toggleValue = (e) => {
    const isChecked = e.target.checked;
    setInputValue(isChecked);
    if (isChecked) {
      fireEvent('onCheck');
    } else {
      fireEvent('onUnCheck');
    }
    setUserInteracted(true);
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setDefaultValue(defaultValueFromProperties);
    setInputValue(defaultValueFromProperties);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValueFromProperties]);

  useEffect(() => {
    if (disable !== disabledState) setDisable(properties.disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.disabledState]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (loading !== loadingState) setLoading(loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(checked);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('toggle', async function () {
      setInputValue(!checked);
      fireEvent('onChange');
      setUserInteracted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  useEffect(() => {
    const setCheckedAndNotify = async (status) => {
      setInputValue(status);
      if (status) {
        fireEvent('onCheck');
      } else {
        fireEvent('onUnCheck');
      }
    };

    const exposedVariables = {
      value: defaultValueFromProperties,
      setChecked: setCheckedAndNotify,
      setValue: setCheckedAndNotify,
      setLoading: async function (loading) {
        setLoading(loading);
        setExposedVariable('isLoading', loading);
      },
      setVisibility: async function (visibility) {
        setVisibility(visibility);
        setExposedVariable('isVisible', visibility);
      },
      setDisable: async function (disable) {
        setDisable(disable);
        setExposedVariable('isDisabled', disable);
      },
      toggle: () => {
        setInputValue(!checked);
        fireEvent('onChange');
        setUserInteracted(true);
      },
      label: label,
      isMandatory: isMandatory,
      isLoading: loading,
      isVisible: visibility,
      isDisabled: disable,
      isValid: isValid,
    };

    setExposedVariables(exposedVariables);

    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleChange = () => {
    const newCheckedState = !checked;
    setInputValue(newCheckedState);
    fireEvent('onChange');
    if (newCheckedState) {
      fireEvent('onCheck');
    } else {
      fireEvent('onUnCheck');
    }
    setUserInteracted(true);
  };

  const setInputValue = (value) => {
    setChecked(value);
    setExposedVariable('value', value);
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  const renderCheckBox = () => (
    <>
      <div
        data-disabled={disable}
        className={`${alignment === 'left' ? 'flex-row-reverse' : 'flex-row'}`}
        style={{
          display: visibility ? 'flex' : 'none',
          boxShadow,
          alignItems: loading && 'center',
          gap: '6px',
          justifyContent: `${loading ? 'center' : alignment === 'left' ? 'space-between' : 'start'}`,
          height,
          whiteSpace: 'nowrap',
        }}
        data-cy={dataCy}
      >
        {loading ? (
          <Loader width="16" />
        ) : (
          <>
            <div
              onClick={handleToggleChange}
              style={{
                ...checkboxStyle,
              }}
            >
              <input
                style={{ display: 'none' }}
                className="form-check-input"
                type="checkbox"
                onClick={toggleValue}
                defaultChecked={defaultValue}
                checked={checked}
              />
              <div style={checkmarkStyle}>
                {checked && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon-tabler icon-tabler-check"
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke={handleColor}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                )}
              </div>
            </div>

            <OverflowTooltip
              className="form-check-label"
              style={{
                lineHeight: '20px',
                color: textColor,
                fontWeight: 400,
                fontSize: '14px',
              }}
              whiteSpace="normal"
              width={width - 20}
            >
              {label}
              {isMandatory && !checked && (
                <span style={{ color: 'var(--cc-error-systemStatus)', marginLeft: '1px' }}>{'*'}</span>
              )}
            </OverflowTooltip>
          </>
        )}
      </div>
      {!isValid && visibility && userInteracted && (
        <div
          data-cy={`${String(componentName).toLowerCase()}-invalid-feedback`}
          style={{
            color: 'var(--cc-error-systemStatus)',
            fontSize: '11px',
            fontWeight: '400',
            lineHeight: '16px',
          }}
        >
          {validationError}
        </div>
      )}
    </>
  );
  const checkmarkStyle = {
    position: 'absolute',
    top: '1px',
    right: '1px',
    visibility: checked ? 'visible' : 'hidden',
    height: '14px',
    width: '14px',
    display: 'flex',
  };

  const checkboxStyle = {
    display: 'inline-block',
    cursor: 'pointer',
    padding: '2px',
    border: `1px solid ${borderColor}`,
    backgroundColor: checked ? checkboxColor : uncheckedColor,
    borderRadius: '5px',
    height: '18px',
    width: '18px',
    minHeight: '18px',
    minWidth: '18px',
    position: 'relative',
    borderColor: borderColor === '#CCD1D5' ? (checked ? 'transparent' : 'var(--borders-default)') : borderColor,
  };

  return (
    <div
      className="checkbox-component"
      style={{
        justifyContent: `${loadingState ? 'center' : 'flex-start'}`,
        paddingTop: '3px',
      }}
    >
      {renderCheckBox()}
    </div>
  );
};
