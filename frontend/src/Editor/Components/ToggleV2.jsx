import React, { useEffect, useState } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import Loader from '@/ToolJetUI/Loader/Loader';
import OverflowTooltip from '@/_components/OverflowTooltip';

const Switch = ({
  on,
  onClick,
  onChange,
  disabledState,
  color,
  alignment,
  borderColor,
  setOn,
  styles,
  setExposedVariable,
  fireEvent,
  setUserInteracted,
}) => {
  const handleToggleChange = () => {
    setOn(!on);
    setExposedVariable('value', !on);
    fireEvent('onChange');
    setUserInteracted(true);
  };

  const switchStyle = {
    position: 'relative',
    display: 'inline-block',
    width: '28px',
    height: '18px',
    marginRight: '0px',
    paddingRight: '0px',
  };

  const sliderStyle = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: on ? styles.toggleSwitchColor : styles.uncheckedColor,
    transition: 'background-color 0.2s',
    borderRadius: '34px',
    outline: `1px solid ${styles.borderColor}`,
  };

  const circleStyle = {
    position: 'absolute',
    content: '',
    height: '12px',
    width: '12px',
    left: '2px',
    bottom: '3px',
    backgroundColor: styles.handleColor,
    transition: 'transform 0.2s',
    borderRadius: '50%',
    transform: on ? 'translateX(12px)' : 'translateX(0)',
  };

  return (
    <div>
      <div className="d-flex" style={switchStyle} onClick={handleToggleChange}>
        <input
          type="checkbox"
          style={{
            opacity: 0,
            width: 0,
            height: 0,
            backgroundColor: on ? `${color}` : 'white',
            marginTop: '0px',
            marginLeft: alignment === 'left' && '-2rem',
            border: `1 px solid ${borderColor}`,
          }}
          disabled={disabledState}
          className="form-check-input "
          checked={on}
          onChange={onChange}
          onClick={onClick}
        />

        <span style={sliderStyle}>
          <span style={circleStyle}></span>
        </span>
      </div>
    </div>
  );
};

export const ToggleSwitchV2 = ({
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  dataCy,
  component,
  validate,
  width,
}) => {
  const defaultValue = properties.defaultValue ?? false;

  const [on, setOn] = useState(Boolean(defaultValue));
  const label = properties.label;
  const { isValid, validationError } = validate(on);
  const [showValidationError, setShowValidationError] = useState(true);
  const [loading, setLoading] = useState(properties?.loadingState);
  const [disable, setDisable] = useState(properties.disabledState || properties.loadingState);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [userInteracted, setUserInteracted] = useState(false);

  const isMandatory = resolveWidgetFieldValue(component?.definition?.validation?.mandatory?.value);

  const { toggleSwitchColor, boxShadow, alignment, borderColor } = styles;
  const textColor = styles.textColor === '#1B1F24' ? 'var(--text-primary)' : styles.textColor;

  const toggleValue = (e) => {
    const toggled = e.target.checked;
    setExposedVariable('value', toggled);
    fireEvent('onChange');
    setUserInteracted(true);
  };
  // Exposing the initially set false value once on load

  useEffect(() => {
    setExposedVariable('value', defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    setOn(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const toggle = () => {
    setOn(!on);
    setUserInteracted(true);
  };

  useEffect(() => {
    if (disable !== properties.disabledState) setDisable(properties.disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.disabledState]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (loading !== properties.loadingState) setLoading(properties.loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

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
  }, [properties.disabledState]);

  useEffect(() => {
    setExposedVariable('toggle', async function () {
      setExposedVariable('value', !on);
      fireEvent('onChange');
      setOn(!on);
      setUserInteracted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  useEffect(() => {
    setExposedVariable('setValue', async function (value) {
      setOn(value);
      setExposedVariable('value', value);
      setUserInteracted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderInput = () => (
    <div
      data-disabled={properties.disabledState}
      className={`${alignment === 'right' ? 'flex-row-reverse' : 'flex-row'}`}
      style={{
        display: visibility ? 'flex' : 'none',
        boxShadow,
        alignItems: loading && 'center',
        gap: '6px ',
        justifyContent: `${properties.loadingState ? 'center' : alignment === 'left' ? 'space-between' : 'start'}`,
        height,
        whiteSpace: 'nowrap',
        paddingTop: '3px',
      }}
      data-cy={dataCy}
    >
      {loading ? (
        <Loader width="16" />
      ) : (
        <>
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
            {isMandatory && !on && <span style={{ color: '#DB4324', marginLeft: '1px' }}>{'*'}</span>}
          </OverflowTooltip>

          <Switch
            disabledState={disable}
            on={on}
            onClick={toggle}
            onChange={toggleValue}
            color={toggleSwitchColor}
            alignment={alignment}
            validationError={validationError}
            isValid={isValid}
            showValidationError={showValidationError}
            properties={properties}
            setShowValidationError={setShowValidationError}
            borderColor={borderColor}
            setOn={setOn}
            styles={styles}
            setExposedVariable={setExposedVariable}
            fireEvent={fireEvent}
            setUserInteracted={setUserInteracted}
          />
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        justifyContent: `${loading ? 'center' : 'flex-start'}`,
      }}
    >
      {renderInput()}
      {showValidationError && isMandatory && userInteracted && !on && visibility && (
        <div
          data-cy={`${String(component.name).toLowerCase()}-invalid-feedback`}
          style={{
            color: 'var(--status-error-strong)',
            fontSize: '11px',
            fontWeight: '400',
            lineHeight: '16px',
          }}
        >
          {validationError}
        </div>
      )}
    </div>
  );
};
