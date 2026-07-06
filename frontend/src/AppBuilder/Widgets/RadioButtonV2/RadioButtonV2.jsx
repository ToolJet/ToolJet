import React, { useEffect, useMemo, useRef, useId } from 'react';
import Label from '@/_ui/Label';
import cx from 'classnames';
import './radioButtonV2.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import { has, isObject } from 'lodash';
import { getSafeRenderableValue } from '../utils';
import {
  getWidthTypeOfComponentStyles,
  getLabelFontSize,
  getLabelWidthOfInput,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

export const RadioButtonV2 = ({
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  componentName,
  validate,
  validation,
  id,
  dataCy,
  componentType,
  moduleId,
  resolveIndex,
}) => {
  const { label, options, disabledState, advanced, schema, optionsLoadingState, layout, loadingState } = properties;

  const {
    activeColor,
    direction,
    auto: labelAutoWidth,
    labelWidth,
    optionsTextColor,
    borderColor,
    switchOffBackgroundColor,
    handleColor,
    switchOnBackgroundColor,
    labelColor,
    alignment,
    widthType,
    labelFontSize,
  } = styles;

  const labelFontSizeValue = getLabelFontSize(labelFontSize);

  const isInitialRender = useRef(true);
  const reactId = useId();

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  function findDefaultItem(optionSchema) {
    if (!Array.isArray(optionSchema)) {
      return undefined;
    }
    const foundItem = optionSchema?.find((item) => item?.default === true && item?.visible === true);
    return foundItem?.value;
  }

  // Store is the source of truth for the exposed value; the resolved default
  // item is the pre-first-publish fallback (old checkedValue useState).
  const storeValue = useExposedVariable(id, 'value', exposedOpts, undefined);
  const initialValue = findDefaultItem(advanced ? schema : options);
  const checkedValue = storeValue !== undefined ? storeValue : initialValue;

  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);

  const isMandatory = validation?.mandatory ?? false;
  const validationStatus = useMemo(() => validate(checkedValue), [checkedValue, validate]);
  const { isValid, validationError } = validationStatus;

  const labelRef = useRef();
  const radioBtnRef = useRef();

  const selectOptions = useMemo(() => {
    let _options = advanced ? schema : options;
    if (Array.isArray(_options)) {
      let _selectOptions = _options
        .filter((data) => data?.visible ?? true)
        .map((data) => ({
          ...data,
          label: getSafeRenderableValue(data?.label),
          value: data?.value,
          isDisabled: data?.disable ?? false,
        }));
      return _selectOptions;
    } else {
      return [];
    }
  }, [advanced, schema, options]);

  // Internal property-sync write-through — writes directly, no dispatch/event
  // (matches old onSelect's local-state path, which never fired events itself).
  const setInputValue = (value) => {
    const _value = isObject(value) && has(value, 'value') ? value?.value : value;
    setExposedVariables({ value: _value });
  };

  // User interaction and the selectOption/deselectOption CSAs share the same
  // command pairs (old onSelect + explicit fireEvent('onSelectionChange')).
  const selectOptionCommands = (value) => [
    { kind: 'INVOKE_CSA', componentId: id, action: 'selectOption', args: [value] },
    { kind: 'FIRE_EVENT', componentId: id, event: 'onSelectionChange' },
  ];
  const deselectOptionCommands = () => [
    { kind: 'INVOKE_CSA', componentId: id, action: 'deselectOption', args: [] },
    { kind: 'FIRE_EVENT', componentId: id, event: 'onSelectionChange' },
  ];

  // Not isInitialRender-gated — matches old (onSelect ran unconditionally,
  // including at mount; the default it computes here is identical to the
  // pre-first-publish fallback above, so this is idempotent on mount).
  useEffect(() => {
    setInputValue(findDefaultItem(advanced ? schema : options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(options)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    setExposedVariable('options', _options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectOptions)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // (selectOption/deselectOption overridden to keep the old event semantics).
  useEffect(() => {
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    setExposedVariables({
      ...csaShims(),
      value: checkedValue,
      label: label,
      options: _options,
      isValid: isValid,
      isMandatory: isMandatory,
      isLoading: loadingState,
      isVisible: properties.visibility,
      isDisabled: disabledState,
      selectOption: async (value) => dispatch(selectOptionCommands(value)),
      deselectOption: async () => dispatch(deselectOptionCommands()),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _width = getLabelWidthOfInput(widthType, labelWidth);

  const computedLayoutStyles = {
    height: '100%',
    flexDirection: layout === 'wrap' ? 'row' : layout,
    ...(layout === 'wrap' && { flexWrap: 'wrap', maxHeight: '100%', height: 'max-content' }),
    overflow: layout === 'row' ? 'auto hidden' : 'hidden auto',
  };

  return (
    <>
      <div
        data-disabled={isDisabled}
        className={cx('radio-button', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : '']: true,
          'flex-row-reverse': direction === 'right' && alignment === 'side',
          'text-right': direction === 'right' && alignment === 'top',
          invisible: !visibility,
          visibility: visibility,
        })}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          paddingLeft: '0px',
        }}
        role="radiogroup"
        id={`component-${id}`}
        aria-hidden={!visibility}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        aria-required={isMandatory}
        aria-invalid={!isValid}
        aria-label={!labelAutoWidth && labelWidth == 0 && label?.length != 0 ? label : undefined}
      >
        <Label
          dataCy={`${dataCy}`}
          label={label}
          width={labelWidth}
          labelRef={labelRef}
          darkMode={darkMode}
          color={labelColor}
          defaultAlignment={alignment}
          direction={direction}
          auto={labelAutoWidth}
          isMandatory={isMandatory}
          _width={_width}
          top={alignment !== 'top' && '2px'}
          widthType={widthType}
          inputId={`component-${id}`}
          fontSize={labelFontSizeValue}
        />

        {isLoading || optionsLoadingState ? (
          <Loader style={{ right: '50%', zIndex: 3, position: 'absolute' }} width="20" />
        ) : (
          <div
            className="d-flex px-0"
            ref={radioBtnRef}
            style={{
              ...computedLayoutStyles,
              ...getWidthTypeOfComponentStyles(widthType, labelWidth, labelAutoWidth, alignment),
            }}
          >
            {selectOptions.map((option, index) => {
              const isChecked = checkedValue == option.value;
              const inputId = `${reactId}-option-${index}`;

              return (
                <label key={index} className="radio-button-container" htmlFor={inputId}>
                  <span
                    data-cy={`${dataCy}-option-label-${index}`}
                    style={{
                      color:
                        optionsTextColor !== '#1B1F24'
                          ? optionsTextColor
                          : isDisabled || isLoading
                          ? 'var(--text-disabled)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {String(option.label)}
                  </span>
                  <input
                    data-cy={`${dataCy}-option-input-${index}`}
                    style={{
                      marginTop: '1px',
                      backgroundColor: checkedValue === option.value ? `${activeColor}` : 'white',
                    }}
                    checked={checkedValue == option.value}
                    type="radio"
                    value={option.value}
                    onChange={() => dispatch(selectOptionCommands(option.value))}
                    disabled={option.isDisabled}
                    id={inputId}
                  />
                  <span
                    className="checkmark"
                    style={{
                      backgroundColor:
                        !isChecked && (option.isDisabled ? 'var(--surfaces-surface-03)' : switchOffBackgroundColor),
                      '--selected-background-color': option.isDisabled
                        ? 'var(--surfaces-surface-03)'
                        : switchOnBackgroundColor,
                      '--selected-border-color': borderColor,
                      '--selected-handle-color': option.isDisabled ? 'var(--icons-default)' : handleColor,
                      border:
                        !isChecked && (option.isDisabled ? 'var(--surfaces-surface-03)' : `1px solid ${borderColor}`),
                    }}
                  ></span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      <div
        className={`${isValid ? 'd-none' : visibility ? 'd-flex' : 'd-none'}`}
        style={{
          color: 'var(--cc-error-systemStatus)',
          justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
          fontSize: '11px',
          fontWeight: '400',
          lineHeight: '16px',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
