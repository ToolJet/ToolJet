/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getModifiedColor, getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import Label from '@/_ui/Label';
import './buttonGroupV2.scss';
import TablerIcon from '@/_ui/Icon/TablerIcon';
// eslint-disable-next-line import/no-unresolved
import { cx } from 'class-variance-authority';
import { getLabelFontSize, getWidthTypeOfComponentStyles } from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

export const ButtonGroupV2 = (props) => {
  // ===== PROPS DESTRUCTURING =====
  const {
    height,
    properties,
    styles,
    fireEvent,
    id,
    dataCy,
    setExposedVariable,
    setExposedVariables,
    width,
    validate,
    validation,
    darkMode,
    componentType,
    moduleId,
    resolveIndex,
  } = props;

  const {
    labelColor,
    alignment,
    direction,
    auto: labelAutoWidth,
    labelWidth,
    backgroundColor,
    hoverBackgroundMode = 'auto',
    hoverBackgroundColor = 'var(--cc-primary-brand)',
    borderColor,
    textColor,
    textSize = 14,
    fontWeight = 'normal',
    iconColor,
    errTextColor,
    selectedBackgroundColor,
    selectedTextColor,
    selectedIconColor,
    borderRadius,
    btnAlignment,
    boxShadow,
    padding,
    labelFontSize,
  } = styles;

  const labelFontSizeValue = getLabelFontSize(labelFontSize);

  const { label, advanced, schema, options, multiSelection, layout, loadingState, disabledState, visibility } =
    properties;

  const isInitialRender = useRef(true);
  const labelRef = useRef(null);
  const groupWrapperRef = useRef(null);
  const groupRef = useRef(null);

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // ===== COMPUTED VALUES =====
  const transformedOptions = advanced ? schema : options;

  const formattedOptions = useMemo(() => {
    return Array.isArray(transformedOptions)
      ? transformedOptions.map((option) => {
          return {
            ...option,
            label: getSafeRenderableValue(option?.label),
            value: option?.value,
            isDisabled: option?.disable ?? false,
          };
        })
      : [];
  }, [JSON.stringify(transformedOptions)]);

  const defaultOptionValues = (options) => {
    const defaultOptions = options.filter((option) => option?.default);
    const defaultValues = defaultOptions.map((option) => option?.value);
    return multiSelection ? defaultValues : defaultValues.length > 0 ? [defaultValues[0]] : [];
  };

  const validOptionValues = formattedOptions.map((option) => option.value);

  // ===== Controlled reads: store is the source of truth ─────────────────
  const storeSelected = useExposedVariable(id, 'selected', exposedOpts, undefined);
  const initialSelected = defaultOptionValues(formattedOptions);
  const selected = storeSelected !== undefined ? storeSelected : initialSelected;

  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);

  // ===== VALIDATION =====
  const isMandatory = validation?.mandatory ?? false;
  const validationStatus = useMemo(() => validate(selected?.length ? selected : null), [selected, validate]);
  const [hoveredButtonIndex, setHoveredButtonIndex] = useState(null);
  const { isValid, validationError } = validationStatus;
  const [userInteracted, setUserInteracted] = useState(false);
  useShowValidationOnFormSubmit(setUserInteracted);

  // Latest-ref: the setSelected CSA (registered once at mount) must never
  // close over stale validOptionValues/multiSelection.
  const setSelectedCtxRef = useRef({ validOptionValues, multiSelection });
  setSelectedCtxRef.current = { validOptionValues, multiSelection };

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
  }, [isValid]);

  // Not isInitialRender-gated — matches old (unconditional selected reset on
  // schema/options change, idempotent on mount since it reuses the same
  // formula as the pre-first-publish fallback above).
  useEffect(() => {
    setExposedVariables({ selected: defaultOptionValues(formattedOptions) });
  }, [advanced, JSON.stringify(options), JSON.stringify(schema), multiSelection]);

  // CSA path (RunJS / other components) — mirrors old exposed `setSelected`
  // filtering semantics exactly (array vs single value, multiSelection).
  const setSelected = async (value) => {
    const { validOptionValues, multiSelection } = setSelectedCtxRef.current;
    let newSelected;
    if (Array.isArray(value)) {
      const filtered = value.filter((item) => validOptionValues.includes(item));
      newSelected = multiSelection ? filtered : filtered.length > 0 ? [filtered[0]] : [];
    } else if (typeof value === 'string' || typeof value === 'number') {
      if (validOptionValues.includes(value)) newSelected = [value];
    }
    if (newSelected !== undefined) {
      dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setSelected', args: [newSelected] }]);
    }
    setUserInteracted(true);
  };

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // (clear/setSelected overridden to keep old userInteracted/filter semantics).
  useEffect(() => {
    setExposedVariables({
      ...csaShims(),
      isLoading,
      isVisible,
      isDisabled,
      selected,
      isValid,
      clear: async function () {
        dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'clear', args: [] }]);
        setUserInteracted(true);
      },
      setSelected,
    });
    isInitialRender.current = false;
  }, []);

  const toggleSelection = (value) => {
    const isSelected = selected.includes(value);
    if (multiSelection) {
      return isSelected ? selected.filter((item) => item !== value) : [...selected, value];
    }
    return isSelected ? [] : [value];
  };

  const handleButtonClick = (value) => {
    const newSelected = toggleSelection(value);
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'setSelected', args: [newSelected] },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onClick' },
    ]);
    setUserInteracted(true);
  };

  // ===== COMPUTED STYLES =====
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const justifyContentByAlignment = btnAlignment === 'left' ? 'start' : btnAlignment === 'right' ? 'end' : 'center';

  const groupStyles = {
    width: layout === 'wrap' ? '100%' : 'max-content',
    flexDirection: layout === 'wrap' ? 'row' : layout,
    ...(layout === 'wrap' && { flexWrap: 'wrap', justifyContent: justifyContentByAlignment }),
  };

  const groupWrapperStyles = {
    height: _height,
    ...(layout === 'column' && { justifyContent: justifyContentByAlignment }),
    overflow: layout === 'row' ? 'auto hidden' : 'hidden auto',
    ...getWidthTypeOfComponentStyles('ofComponent', labelWidth, labelAutoWidth, alignment),
  };

  const commonStyles = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    border: `1px solid ${borderColor}`,
    transition: 'all .1s ease',
    boxShadow,
  };

  const normalizedTextSize = Number(textSize);
  const computedFontSize = Number.isFinite(normalizedTextSize) ? normalizedTextSize : 14;
  const computedLineHeight = computedFontSize * 1.42;
  const computedIconSize = computedLineHeight * 0.8;
  const normalizedFontWeight = fontWeight === 'medium' ? 500 : fontWeight;
  const computedFontWeight = normalizedFontWeight ? normalizedFontWeight : normalizedFontWeight === '0' ? 0 : 'normal';
  const computedHoverBackgroundColor =
    hoverBackgroundMode === 'manual'
      ? hoverBackgroundColor || getModifiedColor(backgroundColor, 'hover')
      : getModifiedColor(backgroundColor, 'hover');

  const selectedStyles = {
    backgroundColor: selectedBackgroundColor,
    color: selectedTextColor,
    border: `1px solid ${selectedBackgroundColor}`,
  };

  const disabledStyles = {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  };

  // ===== ALIGNMENT FIX FOR 'ROW' LAYOUT =====
  useEffect(() => {
    if (!groupWrapperRef.current || !groupRef.current) return;

    const wrapper = groupWrapperRef.current;
    const group = groupRef.current;

    if (layout !== 'row') {
      wrapper.style.justifyContent = justifyContentByAlignment;
      return;
    }

    const syncRowAlignmentAndScroll = () => {
      const maxScrollLeft = Math.max(group.clientWidth - wrapper.clientWidth, 0);
      const hasOverflow = maxScrollLeft > 0;

      if (hasOverflow) {
        wrapper.style.justifyContent = 'start';
      } else {
        wrapper.style.justifyContent = justifyContentByAlignment;
      }
    };

    syncRowAlignmentAndScroll();
  }, [layout, btnAlignment, justifyContentByAlignment, JSON.stringify(formattedOptions), width]);

  // ===== MAIN RENDER =====
  return (
    <>
      <div
        className={cx('button-group-widget', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : '']: true,
          'd-none': !isVisible,
          'tw-flex-row-reverse': alignment === 'side' && direction === 'right',
        })}
        role="group"
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
          auto={labelAutoWidth}
          darkMode={darkMode}
          color={labelColor}
          direction={direction}
          defaultAlignment={alignment}
          isMandatory={isMandatory}
          _width={labelWidth}
          top={alignment !== 'top' && '9px'}
          id={`${id}-label`}
          dataCy={dataCy}
          fontSize={labelFontSizeValue}
        />
        <div className="button-group-content-wrapper" style={groupWrapperStyles} ref={groupWrapperRef}>
          {isLoading ? (
            <Loader
              absolute={false}
              style={{ margin: '0 auto', marginTop: alignment !== 'top' ? '8px' : '0' }}
              width="20"
            />
          ) : (
            <div className="button-group-content" style={groupStyles} ref={groupRef}>
              {formattedOptions?.map((option, index) => (
                <button
                  data-cy={`${dataCy}-button-${index}`}
                  style={{
                    ...commonStyles,
                    backgroundColor:
                      hoveredButtonIndex === index && !selected?.includes(option.value)
                        ? computedHoverBackgroundColor
                        : backgroundColor,
                    ...(selected?.includes(option.value) && selectedStyles),
                    ...(option.isDisabled && disabledStyles),
                    fontSize: `${computedFontSize}px`,
                    lineHeight: `${computedLineHeight}px`,
                    fontWeight: computedFontWeight,
                  }}
                  key={index}
                  disabled={option.isDisabled}
                  className={'button-group-button'}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleButtonClick(option.value);
                  }}
                  onMouseEnter={() => {
                    setHoveredButtonIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredButtonIndex(null);
                  }}
                >
                  {option.iconVisibility && (
                    <div
                      className="tw-flex tw-shrink-0"
                      style={{
                        width: `${computedIconSize}px`,
                        height: `${computedIconSize}px`,
                      }}
                    >
                      <TablerIcon
                        iconName={option.icon}
                        style={{
                          width: `${computedIconSize}px`,
                          height: `${computedIconSize}px`,
                          color: selected?.includes(option.value) ? selectedIconColor : iconColor,
                        }}
                        stroke={1.5}
                        data-cy={`${dataCy}-icon`}
                      />
                    </div>
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
