/* eslint-disable import/no-unresolved */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cx } from 'class-variance-authority';
import Label from '@/_ui/Label';
import { getLabelFontSize, getWidthTypeOfComponentStyles } from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { IconX } from '@tabler/icons-react';
import { getModifiedColor, getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import './colorpicker.scss';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import { SketchPicker } from 'react-color';
import { getTinyColorInstance, getExposedColorState } from './utils';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

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
    componentType,
    moduleId,
    resolveIndex,
  } = props;

  const { label, placeholder, defaultColor, format, showAlpha, showClearBtn, loadingState, visibility, disabledState } =
    properties;

  const {
    color: labelColor,
    alignment,
    direction,
    auto,
    width: labelWidth,
    backgroundColor,
    borderColor,
    accentColor,
    textColor,
    errTextColor,
    borderRadius,
    boxShadow,
    padding,
    labelFontSize,
  } = styles;

  const labelFontSizeValue = getLabelFontSize(labelFontSize);

  // ===== STATE MANAGEMENT =====
  const isInitialRender = useRef(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth; the resolved defaultColor/showAlpha derive
  // the pre-first-publish fallback (old exposedVariablesTemporaryState init).
  const initialColorState = getExposedColorState(getTinyColorInstance(defaultColor), showAlpha);
  const selectedColorHex = useExposedVariable(id, 'selectedColorHex', exposedOpts, initialColorState.selectedColorHex);
  const selectedColorRGB = useExposedVariable(id, 'selectedColorRGB', exposedOpts, initialColorState.selectedColorRGB);
  const selectedColorRGBA = useExposedVariable(
    id,
    'selectedColorRGBA',
    exposedOpts,
    initialColorState.selectedColorRGBA
  );
  const colorFormat = useExposedVariable(id, 'colorFormat', exposedOpts, format);
  const allowOpacity = useExposedVariable(id, 'allowOpacity', exposedOpts, showAlpha);
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);

  const labelRef = useRef(null);

  // ===== COMPUTED VALUES =====
  const displayedColor = colorFormat === 'rgb' ? selectedColorRGB : selectedColorHex;

  // ===== VALIDATION =====
  const isMandatory = validation?.mandatory ?? false;
  const validationStatus = useMemo(() => validate(selectedColorHex ?? null), [selectedColorHex, validate]);
  const { isValid, validationError } = validationStatus;
  const [userInteracted, setUserInteracted] = useState(false);
  useShowValidationOnFormSubmit(setUserInteracted);

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const nextExposedColorState = getExposedColorState(getTinyColorInstance(defaultColor), allowOpacity);
    setExposedVariables(nextExposedColorState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultColor]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('colorFormat', format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const nextExposedColorState = getExposedColorState(getTinyColorInstance(selectedColorRGBA), showAlpha);
    setExposedVariables({
      allowOpacity: showAlpha,
      selectedColorHex: nextExposedColorState.selectedColorHex,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAlpha]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatcher
  // (setColor overridden to keep old userInteracted semantics).
  useEffect(() => {
    setExposedVariables({
      ...initialColorState,
      colorFormat: format,
      allowOpacity: showAlpha,
      isLoading: loadingState,
      isVisible: visibility,
      isDisabled: disabledState || loadingState,
      isValid,
      ...csaShims(),
      setColor: async (value) => {
        dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setColor', args: [value] }]);
        setUserInteracted(true);
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== EVENT HANDLER =====
  // Derives directly from the picker's already-parsed rgb — bypasses the
  // contract's tinycolor-parse path (matches old handleColorChange exactly).
  const handleColorChange = (code) => {
    const { r, g, b, a } = code.rgb;

    const nextExposedColorState = {
      selectedColorHex: allowOpacity ? getTinyColorInstance(code.hex).setAlpha(a).toHex8String() : code.hex,
      selectedColorRGB: `rgb(${r}, ${g}, ${b})`,
      selectedColorRGBA: `rgba(${r}, ${g}, ${b}, ${a})`,
    };

    setExposedVariables(nextExposedColorState);
    setUserInteracted(true);
    fireEvent('onChange');
  };

  // ===== COMPUTED STYLES =====
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;

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
    color: selectedColorHex ? textColor : 'var(--cc-placeholder-text)',
    backgroundColor,
    boxShadow,
    ...(isLoading && { justifyContent: 'start' }),
    ...getWidthTypeOfComponentStyles('ofComponent', labelWidth, auto, alignment),
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

  const getBackground = (color) => {
    const size = 6.5;
    const grid = `repeating-conic-gradient(#cfcfcf 0% 25%, #f2f2f2 0% 50%) ${size / 2}px ${
      size / 2
    }px / ${size}px ${size}px`;
    if (!color) return grid;
    return `linear-gradient(${color}, ${color}), ${grid}`;
  };

  // ===== MAIN RENDER =====
  return (
    <>
      <div
        className={cx('color-picker-widget', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) || (auto && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : 'align-items-center']: true,
          'd-none': !isVisible,
          'tw-flex-row-reverse': alignment === 'side' && direction === 'right',
        })}
        id={`component-${id}`}
        aria-hidden={!isVisible}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        aria-invalid={!isValid}
        aria-labelledby={`${id}-label`}
        data-cy={dataCy}
        data-disabled={isDisabled}
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
          _width={labelWidth}
          id={`${id}-label`}
          dataCy={dataCy}
          fontSize={labelFontSizeValue}
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
              type="button"
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
              {isLoading ? (
                <Loader absolute={false} width="18" />
              ) : (
                <>
                  <div className="color-info">
                    <span
                      className="color-preview"
                      style={{
                        background: getBackground(selectedColorRGBA),
                      }}
                    ></span>
                    <span className="color-code">{getSafeRenderableValue(displayedColor || placeholder)}</span>
                  </div>
                  {showClearBtn && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="tj-input-clear-btn"
                      aria-label="Clear"
                      onClick={(event) => {
                        event.stopPropagation();
                        const nextExposedColorState = getExposedColorState();
                        setExposedVariables(nextExposedColorState);
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
              className="color-picker-widget-popover"
              sideOffset={2}
              align="start"
              side="bottom"
              avoidCollisions={true}
              collisionBoundary={document.getElementById('real-canvas')}
              role="dialog"
              aria-label="Color picker"
            >
              <SketchPicker
                color={selectedColorRGBA}
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
      {userInteracted && isVisible && !isValid && (
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
