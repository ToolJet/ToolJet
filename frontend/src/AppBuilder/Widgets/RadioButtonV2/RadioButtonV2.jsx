import React, { useEffect, useMemo, useState, useRef, useId } from 'react';
import Label from '@/_ui/Label';
import cx from 'classnames';
import './radioButtonV2.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import { has, isObject } from 'lodash';
import {
  getWidthTypeOfComponentStyles,
  getLabelFontSize,
  getLabelWidthOfInput,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';
import { useFormClear } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { useContentStable } from '@/AppBuilder/_engines/data/useContentStable';
import {
  radioButtonV2Exposure,
  selectOptionsOf,
  defaultValueOf,
} from '@/AppBuilder/_engines/materialize/widgets/RadioButtonV2';

const { actions } = radioButtonV2Exposure;

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
  height,
  width,
  currentLayout,
  currentMode,
  subContainerIndex,
  componentType,
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

  const [checkedValue, setCheckedValue] = useState(defaultValueOf(properties));
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  const isMandatory = validation?.mandatory ?? false;
  const [validationStatus, setValidationStatus] = useState(validate(checkedValue));
  const { isValid, validationError } = validationStatus;

  const labelRef = useRef();
  const radioBtnRef = useRef();

  // The options container grows when options stack (column) or wrap to new rows;
  // the observer fires on those height changes for dynamic height
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  const heightChangeValue = useHeightObserver(radioBtnRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility,
    subContainerIndex,
    componentType,
  });

  const selectOptions = useMemo(() => selectOptionsOf({ advanced, schema, options }), [advanced, schema, options]);

  function onSelect(value) {
    const _value = isObject(value) && has(value, 'value') ? value?.value : value;
    setCheckedValue(_value);
    setExposedVariable('value', _value);
    const validationStatus = validate(_value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }

  const stableOptions = useContentStable(options);
  const stableSchema = useContentStable(schema);
  useEffect(() => {
    onSelect(defaultValueOf({ advanced, schema, options }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, stableSchema, stableOptions]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setIsLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  const stableSelectOptions = useContentStable(selectOptions);
  useEffect(() => {
    if (isInitialRender.current) return;
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    setExposedVariable('options', _options);

    setExposedVariable('selectOption', async function (value) {
      onSelect(value);
      fireEvent('onSelectionChange');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableSelectOptions]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(checkedValue);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

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

  useEffect(() => {
    const exposedVariables = {
      // The first value's status is the one computed above; validating it again could see a store changed since.
      ...radioButtonV2Exposure.initial({
        properties,
        validation,
        validate: (value) => (Object.is(value, checkedValue) ? validationStatus : validate(value)),
      }),
      selectOption: async function (value) {
        onSelect(value);
        fireEvent('onSelectionChange');
      },
      deselectOption: async function () {
        onSelect(null);
        fireEvent('onSelectionChange');
      },
      setVisibility: async function (value) {
        const { isVisible } = actions.setVisibility(undefined, [value]);
        setVisibility(isVisible);
        setExposedVariable('isVisible', isVisible);
      },
      setDisable: async function (value) {
        const { isDisabled } = actions.setDisable(undefined, [value]);
        setIsDisabled(isDisabled);
        setExposedVariable('isDisabled', isDisabled);
      },
      setLoading: async function (value) {
        const { isLoading } = actions.setLoading(undefined, [value]);
        setIsLoading(isLoading);
        setExposedVariable('isLoading', isLoading);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFormClear(() => onSelect(null));

  const _width = getLabelWidthOfInput(widthType, labelWidth);

  const computedLayoutStyles = {
    height: isDynamicHeightEnabled ? 'max-content' : '100%',
    flexDirection: layout === 'wrap' ? 'row' : layout,
    ...(layout === 'wrap' && {
      flexWrap: 'wrap',
      maxHeight: isDynamicHeightEnabled ? 'none' : '100%',
      height: 'max-content',
    }),
    overflow: layout === 'row' ? 'auto hidden' : isDynamicHeightEnabled ? 'visible' : 'hidden auto',
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
          height: isDynamicHeightEnabled ? 'auto' : '100%',
          ...(isDynamicHeightEnabled && { minHeight: height }),
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
                    onChange={() => {
                      onSelect(option.value);
                      fireEvent('onSelectionChange');
                    }}
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
