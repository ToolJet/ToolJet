/* eslint-disable import/no-unresolved */
import React, { useEffect, useRef, useState } from 'react';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import * as Popover from '@radix-ui/react-popover';
import { cx } from 'class-variance-authority';
import Label from '@/_ui/Label';
import {
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import { getModifiedColor, getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import './colorpicker.scss';
import { SketchPicker } from 'react-color';
import { getTinyColorInstance, getExposedColorState } from './utils';

export const ColorPicker = (props) => {
  // ===== PROPS DESTRUCTURING =====
  const {
    properties,
    styles,
    setExposedVariable,
    setExposedVariables,
    darkMode,
    height,
    fireEvent,
    dataCy,
    id,
    validate,
    validation,
  } = props;

  const { label, placeholder, defaultColor, format, showAlpha, showClearBtn, loadingState, visibility, disabledState } =
    properties;

  const {
    color: labelColor,
    alignment,
    direction,
    auto,
    width: labelWidth,
    widthType,
    backgroundColor,
    borderColor,
    accentColor,
    textColor,
    errTextColor,
    borderRadius,
    boxShadow,
    padding,
  } = styles;

  // ===== STATE MANAGEMENT =====
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    ...getExposedColorState(getTinyColorInstance(defaultColor), showAlpha),
    colorFormat: format,
    allowOpacity: showAlpha,
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState || loadingState,
  });

  const labelRef = useRef(null);

  // ===== COMPUTED VALUES =====
  const displayedColor =
    exposedVariablesTemporaryState.colorFormat === 'rgb'
      ? exposedVariablesTemporaryState.selectedColorRGB
      : exposedVariablesTemporaryState.selectedColorHex;

  // ===== VALIDATION =====
  const isMandatory = validation?.mandatory ?? false;
  const [validationStatus, setValidationStatus] = useState(
    validate(exposedVariablesTemporaryState.selectedColorHex ?? null)
  );
  const { isValid, validationError } = validationStatus;
  const [userInteracted, setUserInteracted] = useState(false);

  const updateValidationState = (selectedColorHex) => {
    const nextValidationStatus = validate(selectedColorHex || null);
    setValidationStatus(nextValidationStatus);
    setExposedVariable('isValid', nextValidationStatus?.isValid);
    return nextValidationStatus;
  };

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const updateExposedVariablesStates = (values) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      ...values,
    }));
  };

  // ===== EFFECTS =====
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: properties.visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
    {
      dep: defaultColor,
      sideEffect: () => {
        const nextExposedColorState = getExposedColorState(
          getTinyColorInstance(defaultColor),
          exposedVariablesTemporaryState.allowOpacity
        );

        updateExposedVariablesStates(nextExposedColorState);
        setExposedVariables(nextExposedColorState);
        updateValidationState(nextExposedColorState.selectedColorHex);
      },
    },
    {
      dep: format,
      sideEffect: () => {
        updateExposedVariablesState('colorFormat', format);
        setExposedVariable('colorFormat', format);
      },
    },
    {
      dep: showAlpha,
      sideEffect: () => {
        const nextExposedColorState = getExposedColorState(
          getTinyColorInstance(exposedVariablesTemporaryState.selectedColorRGBA),
          showAlpha
        );

        const formattedState = {
          allowOpacity: showAlpha,
          selectedColorHex: nextExposedColorState.selectedColorHex,
        };

        updateExposedVariablesStates(formattedState);
        setExposedVariables(formattedState);
        updateValidationState(nextExposedColorState.selectedColorHex);
      },
    },
    {
      dep: validate,
      sideEffect: () => {
        updateValidationState(exposedVariablesTemporaryState.selectedColorHex);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      ...exposedVariablesTemporaryState,
      isValid: isValid,
      setDisable: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
    };

    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setExposedVariable('setColor', async function (value) {
      const nextExposedColorState = getExposedColorState(
        getTinyColorInstance(value),
        exposedVariablesTemporaryState.allowOpacity
      );

      updateExposedVariablesStates(nextExposedColorState);
      setExposedVariables(nextExposedColorState);
      updateValidationState(nextExposedColorState.selectedColorHex);

      setUserInteracted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposedVariablesTemporaryState.allowOpacity]);

  // ===== EVENT HANDLER =====
  const handleColorChange = (code) => {
    const { r, g, b, a } = code.rgb;

    const nextExposedColorState = {
      selectedColorHex: exposedVariablesTemporaryState.allowOpacity
        ? getTinyColorInstance(code.hex).setAlpha(a).toHex8String()
        : code.hex,
      selectedColorRGB: `rgb(${r}, ${g}, ${b})`,
      selectedColorRGBA: `rgba(${r}, ${g}, ${b}, ${a})`,
    };

    updateExposedVariablesStates(nextExposedColorState);
    setExposedVariables(nextExposedColorState);
    updateValidationState(nextExposedColorState.selectedColorHex);

    setUserInteracted(true);
    fireEvent('onChange');
  };

  // ===== COMPUTED STYLES =====
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const _width = getLabelWidthOfInput(widthType, labelWidth); // Max width which label can go is 70% for better UX calculate width

  const isFocusedOrOpen = isFocused || showColorPicker;
  const buttonBorderColor = !isValid
    ? errTextColor
    : isFocusedOrOpen
    ? accentColor
    : isHovered
    ? getModifiedColor(borderColor, 24)
    : borderColor;

  const buttonStyles = {
    borderRadius: `${borderRadius}px`,
    height: _height,
    border: `1px solid ${buttonBorderColor}`,
    outline: isFocusedOrOpen ? `1px solid ${accentColor}` : 'none',
    outlineOffset: '0px',
    color: exposedVariablesTemporaryState.selectedColorHex ? textColor : 'var(--cc-placeholder-text)',
    backgroundColor,
    boxShadow,
    ...(exposedVariablesTemporaryState.isLoading && { justifyContent: 'start' }),
    ...getWidthTypeOfComponentStyles(widthType, labelWidth, auto, alignment),
  };

  const pickerStyles = {
    default: {
      picker: {
        padding: '0px',
      },
      saturation: {
        borderRadius: '2px',
      },
      color: {
        display: 'none',
      },
      sliders: {
        padding: '0px',
        margin: '8px 0px 4px 0px',
      },
      hue: {
        height: '16px',
        borderRadius: '1px',
      },
      alpha: {
        height: '16px',
        borderRadius: '1px',
        marginTop: '8px',
      },
    },
  };

  // ===== MAIN RENDER =====
  return (
    <>
      <div
        className={cx('color-picker-widget', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) || (auto && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : '']: true,
          'd-none': !exposedVariablesTemporaryState.isVisible,
          'tw-flex-row-reverse': alignment === 'side' && direction === 'right',
        })}
        id={`component-${id}`}
        aria-hidden={!exposedVariablesTemporaryState.isVisible}
        aria-disabled={exposedVariablesTemporaryState.isDisabled}
        aria-busy={exposedVariablesTemporaryState.isLoading}
        aria-invalid={!isValid}
        aria-labelledby={`${id}-label`}
        data-cy={dataCy}
        data-disabled={exposedVariablesTemporaryState.isDisabled}
      >
        <Label
          label={label}
          width={labelWidth}
          labelRef={labelRef}
          auto={auto}
          darkMode={darkMode}
          color={labelColor}
          direction={direction}
          defaultAlignment={alignment}
          isMandatory={isMandatory}
          _width={_width}
          widthType={widthType}
          top={alignment !== 'top' && '9px'}
          id={`${id}-label`}
          dataCy={dataCy}
        />
        <Popover.Root
          open={showColorPicker}
          onOpenChange={(open) => {
            setShowColorPicker(open);
            fireEvent(open ? 'onFocus' : 'onBlur');
          }}
        >
          <Popover.Trigger asChild>
            <button
              className="color-picker-button"
              style={buttonStyles}
              data-cy={`${dataCy}-button`}
              aria-haspopup="dialog"
              aria-expanded={showColorPicker}
              aria-controls={`color-picker-${id}-popover`}
              data-clear-enabled={showClearBtn}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {exposedVariablesTemporaryState.isLoading ? (
                <Loader absolute={false} width="18" />
              ) : (
                <>
                  <div className="color-info">
                    <span
                      className="color-preview"
                      style={{ backgroundColor: exposedVariablesTemporaryState.selectedColorRGBA }}
                    ></span>
                    <span className="color-code">{getSafeRenderableValue(displayedColor || placeholder)}</span>
                  </div>
                  {showClearBtn && (
                    <span
                      role="button"
                      className="tj-input-clear-btn"
                      aria-label="Clear"
                      onClick={(event) => {
                        event.stopPropagation();
                        const nextExposedColorState = getExposedColorState();
                        updateExposedVariablesStates(nextExposedColorState);
                        setExposedVariables(nextExposedColorState);
                        updateValidationState(nextExposedColorState.selectedColorHex);
                        setUserInteracted(true);
                      }}
                    >
                      <IconX size={16} color="var(--borders-strong)" className="cursor-pointer clear-indicator" />
                    </span>
                  )}
                </>
              )}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              id={`color-picker-${id}-popover`}
              data-cy={`${dataCy}-popover`}
              className="color-picker-popover"
              sideOffset={2}
              align="start"
              side="bottom"
              avoidCollisions={true}
              collisionBoundary={document.getElementById('real-canvas')}
              role="dialog"
              aria-label="Color picker"
            >
              <SketchPicker
                color={exposedVariablesTemporaryState.selectedColorRGBA}
                onChangeComplete={handleColorChange}
                id={`component-${id}`}
                disableAlpha={!showAlpha}
                presetColors={[]}
                styles={pickerStyles}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      {userInteracted && exposedVariablesTemporaryState.isVisible && !isValid && (
        <div
          className="d-flex"
          style={{
            color: errTextColor,
            justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
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
};

export default ColorPicker;
