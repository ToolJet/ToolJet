import React, { useEffect, useState } from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import Loader from '@/ToolJetUI/Loader/Loader';
import OverflowTooltip from '@/_components/OverflowTooltip';

export const Checkbox = function Checkbox({
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  dataCy,
  component,
  validate,
  isResizing,
  width,
}) {
  const defaultValueFromProperties = properties.defaultValue ?? false;
  const [defaultValue, setDefaultvalue] = React.useState(defaultValueFromProperties);
  const [checked, setChecked] = React.useState(defaultValueFromProperties);
  const [value, setValue] = React.useState(defaultValueFromProperties);

  const { label } = properties;
  const textColor = styles.textColor === '#1B1F24' ? 'var(--text-primary)' : styles.textColor;
  const currentState = useCurrentState();
  const { loadingState, disabledState } = properties;
  const { checkboxColor, boxShadow, alignment, uncheckedColor, borderColor, handleColor } = styles;

  const [loading, setLoading] = useState(properties?.loadingState);
  const [disable, setDisable] = useState(disabledState || loadingState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const { isValid, validationError } = validate(checked);

  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);

  function toggleValue(e) {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    setValue(isChecked);

    setExposedVariable('value', isChecked);
    if (isChecked) {
      fireEvent('onCheck');
    } else {
      fireEvent('onUnCheck');
    }
  }
  useEffect(() => {
    const setCheckedAndNotify = async (status) => {
      await setExposedVariable('value', status);
      if (status) {
        fireEvent('onCheck');
      } else {
        fireEvent('onUnCheck');
      }
      setChecked(status);
      setValue(status);
    };
    const exposedVariables = {
      value: defaultValueFromProperties,
      setChecked: setCheckedAndNotify,
      setValue: setCheckedAndNotify,
    };

    setDefaultvalue(defaultValueFromProperties);
    setChecked(defaultValueFromProperties);
    setValue(defaultValueFromProperties);
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValueFromProperties]);

  useEffect(() => {
    disable !== disabledState && setDisable(properties.disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.disabledState]);

  useEffect(() => {
    visibility !== properties.visibility && setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    loading !== loadingState && setLoading(loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    setExposedVariable('isLoading', loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);
  useEffect(() => {
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('isDisabled', disable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disable]);
  useEffect(() => {
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);
  useEffect(() => {
    setExposedVariable('setLoading', async function (loading) {
      setLoading(loading);
      setExposedVariable('isLoading', loading);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (state) {
      setVisibility(state);
      setExposedVariable('isVisible', state);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    setExposedVariable('setDisable', async function (disable) {
      setDisable(disable);
      setExposedVariable('isDisabled', disable);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    setExposedVariable('toggle', async function () {
      setExposedVariable('value', !checked);
      fireEvent('onChange');
      setChecked(!checked);
      setValue(!checked);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, value]);

  const renderCheckBox = () => (
    <>
      <div
        data-disabled={disabledState}
        className={`${alignment === 'left' ? 'flex-row-reverse' : 'flex-row'}`}
        style={{
          display: visibility ? 'flex' : 'none',
          boxShadow,
          alignItems: loading && 'center',
          gap: '6px ',
          justifyContent: `${loadingState ? 'center' : alignment == 'left' ? 'space-between' : 'start'}`,
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
                onClick={(e) => {
                  toggleValue(e);
                }}
                defaultChecked={defaultValue}
                checked={checked}
              />
              <div style={checkmarkStyle}>
                {checked && !isResizing && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className=" icon-tabler icon-tabler-check"
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
              {isMandatory && !checked && <span style={{ color: '#DB4324', marginLeft: '1px' }}>{'*'}</span>}
            </OverflowTooltip>
          </>
        )}
      </div>
      {validationError && visibility && (
        <div
          className="tj-text-sm"
          data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
          style={{ color: 'var(--status-error-strong)' }}
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
    width: ' 14px',
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
    borderColor: '#CCD1D5' == borderColor ? (checked ? 'transparent' : 'var(--borders-default)') : borderColor,
  };
  const handleToggleChange = () => {
    const newCheckedState = !checked;
    setChecked(newCheckedState);
    setValue(newCheckedState);
    setExposedVariable('value', newCheckedState).then(fireEvent('onChange'));
    if (newCheckedState) {
      fireEvent('onCheck');
    } else {
      fireEvent('onUnCheck');
    }
  };

  return (
    <>
      <div
        className="checkbox-component"
        style={{
          justifyContent: `${loadingState ? 'center' : 'flex-start'}`,
          paddingTop: '3px',
        }}
      >
        {renderCheckBox()}
      </div>
    </>
  );
};
