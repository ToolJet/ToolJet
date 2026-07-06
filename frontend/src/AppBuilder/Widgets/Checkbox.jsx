import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const Checkbox = ({
  height,
  properties,
  styles,
  fireEvent,
  componentName,
  setExposedVariables,
  validation,
  dataCy,
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
  const defaultValueFromProperties = properties.defaultValue ?? false;
  const isMandatory = validation?.mandatory ?? false;
  const [userInteracted, setUserInteracted] = useState(false);
  useShowValidationOnFormSubmit(setUserInteracted);

  const { label } = properties;
  const textColor = ['#1B1F24', '#000', '#000000ff'].includes(styles.textColor)
    ? 'var(--text-primary)'
    : styles.textColor;
  const { loadingState, disabledState } = properties;
  const { checkboxColor, boxShadow, alignment, uncheckedColor, borderColor, handleColor } = styles;

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const checked = useExposedVariable(id, 'value', exposedOpts, defaultValueFromProperties);
  const loading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const disable = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);

  const validationStatus = useMemo(() => validate(checked), [validate, checked]);
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

  const toggleValue = (e) => {
    const isChecked = e.target.checked;
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [isChecked] },
      { kind: 'FIRE_EVENT', componentId: id, event: isChecked ? 'onCheck' : 'onUnCheck' },
    ]);
    setUserInteracted(true);
  };

  /* ── Property-change effects (skip-initial, mirroring the old widget) ─── */
  useEffect(() => {
    if (isInitialRender.current) return;
    dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [defaultValueFromProperties] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValueFromProperties]);

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
    setExposedVariables({ isLoading: loadingState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

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
     setValue/setChecked keep their conditional onCheck/onUnCheck events and
     toggle its onChange + userInteracted flag (old closure semantics). ──── */
  useEffect(() => {
    const setCheckedAndNotify = async (status) => {
      dispatch([
        { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [status] },
        { kind: 'FIRE_EVENT', componentId: id, event: status ? 'onCheck' : 'onUnCheck' },
      ]);
    };

    setExposedVariables({
      ...csaShims(),
      value: defaultValueFromProperties,
      setChecked: setCheckedAndNotify,
      setValue: setCheckedAndNotify,
      toggle: async () => {
        dispatch([
          { kind: 'INVOKE_CSA', componentId: id, action: 'toggle', args: [] },
          { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
        ]);
        setUserInteracted(true);
      },
      label: label,
      isMandatory: isMandatory,
      isLoading: loadingState,
      isVisible: properties.visibility,
      isDisabled: disabledState || loadingState,
      isValid: validationStatusRef.current?.isValid,
    });

    isInitialRender.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleChange = () => {
    const newCheckedState = !checked;
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [newCheckedState] },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
      { kind: 'FIRE_EVENT', componentId: id, event: newCheckedState ? 'onCheck' : 'onUnCheck' },
    ]);
    setUserInteracted(true);
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
                defaultChecked={defaultValueFromProperties}
                checked={checked}
                id={inputId}
                aria-disabled={disable}
                aria-busy={loading}
                aria-required={isMandatory}
                aria-hidden={!visibility}
                aria-invalid={!isValid}
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
              <label htmlFor={inputId}>
                {label}
                {isMandatory && <span style={{ color: 'var(--cc-error-systemStatus)', marginLeft: '1px' }}>{'*'}</span>}
              </label>
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
