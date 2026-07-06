import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

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
  fireEvent,
  setUserInteracted,
  visibility,
  isMandatory,
  isValid,
  inputId,
}) => {
  const handleToggleChange = () => {
    setOn(!on);
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
          id={inputId}
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
          aria-disabled={disabledState}
          aria-hidden={!visibility}
          aria-required={isMandatory}
          aria-invalid={!isValid}
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
  setExposedVariables,
  dataCy,
  validation,
  componentName,
  validate,
  width,
  id,
  componentType,
  moduleId,
  resolveIndex,
}) => {
  const isInitialRender = useRef(true);
  const reactId = useId();
  const inputId = `component-${reactId}`;
  const defaultValue = properties.defaultValue ?? false;
  const label = properties.label;
  const isMandatory = validation?.mandatory ?? false;
  const [userInteracted, setUserInteracted] = useState(false);
  useShowValidationOnFormSubmit(setUserInteracted);

  const { toggleSwitchColor, boxShadow, alignment, borderColor } = styles;
  const textColor = styles.textColor === '#1B1F24' ? 'var(--text-primary)' : styles.textColor;

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const on = useExposedVariable(id, 'value', exposedOpts, Boolean(defaultValue));
  const loading = useExposedVariable(id, 'isLoading', exposedOpts, properties.loadingState);
  const disable = useExposedVariable(
    id,
    'isDisabled',
    exposedOpts,
    properties.disabledState || properties.loadingState
  );
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);

  const validationStatus = useMemo(() => validate(on), [validate, on]);
  const { isValid, validationError } = validationStatus;
  const validationStatusRef = useRef(validationStatus);
  validationStatusRef.current = validationStatus;

  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
    validate,
  });

  // Input onChange path (old toggleValue): publishes the toggled value and
  // fires onChange — validation folds in via the dispatch ctx.
  const toggleValue = (e) => {
    const toggled = e.target.checked;
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [toggled] },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
    ]);
    setUserInteracted(true);
  };

  // Value write without events (old setInputValue).
  const setInputValue = (value) => {
    dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [value] }]);
  };

  // Input onClick path (old local toggle): flips value, no event.
  const toggle = () => {
    dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'toggle', args: [] }]);
    setUserInteracted(true);
  };

  /* ── Property-change effects (skip-initial, mirroring the old widget) ─── */
  useEffect(() => {
    if (isInitialRender.current) return;
    setInputValue(defaultValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isDisabled: properties.disabledState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isVisible: properties.visibility });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isLoading: properties.loadingState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isMandatory });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariables({ isValid: validationStatusRef.current?.isValid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers.
     setValue keeps its userInteracted flag and toggle its onChange event
     (old closure semantics). ────────────────────────────────────────────── */
  useEffect(() => {
    setExposedVariables({
      ...csaShims(),
      setValue: async (value) => {
        setInputValue(value);
        setUserInteracted(true);
      },
      toggle: async () => {
        dispatch([
          { kind: 'INVOKE_CSA', componentId: id, action: 'toggle', args: [] },
          { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
        ]);
        setUserInteracted(true);
      },
      label: label,
      isMandatory: isMandatory,
      isLoading: properties.loadingState,
      isVisible: properties.visibility,
      isDisabled: properties.disabledState || properties.loadingState,
      isValid: validationStatusRef.current?.isValid,
      value: defaultValue,
    });
    isInitialRender.current = false;
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
            <label htmlFor={inputId}>{label}</label>
            {isMandatory && <span style={{ color: 'var(--cc-error-systemStatus)', marginLeft: '1px' }}>{'*'}</span>}
          </OverflowTooltip>

          <Switch
            disabledState={disable}
            on={on}
            onClick={toggle}
            onChange={toggleValue}
            color={toggleSwitchColor}
            alignment={alignment}
            isValid={isValid}
            properties={properties}
            borderColor={borderColor}
            setOn={setInputValue}
            styles={styles}
            fireEvent={fireEvent}
            setUserInteracted={setUserInteracted}
            visibility={visibility}
            isMandatory={isMandatory}
            inputId={inputId}
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
      {userInteracted && visibility && !isValid && (
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
    </div>
  );
};
