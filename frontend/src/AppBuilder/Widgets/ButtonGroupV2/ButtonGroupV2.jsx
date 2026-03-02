/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import Label from '@/_ui/Label';
import './buttonGroupV2.scss';
import TablerIcon from '@/_ui/Icon/TablerIcon';
// eslint-disable-next-line import/no-unresolved
import { cx } from 'class-variance-authority';

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
  } = props;

  const {
    backgroundColor,
    borderColor,
    textColor,
    iconColor,
    selectedBackgroundColor,
    selectedTextColor,
    selectedIconColor,
    borderRadius,
    btnAlignment,
    boxShadow,
    padding,
    errTextColor,
  } = styles;

  const { label, advanced, schema, options, multiSelection, layout, loadingState, disabledState, visibility } =
    properties;

  const labelRef = useRef(null);
  const groupWrapperRef = useRef(null);
  const groupRef = useRef(null);

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

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState || loadingState,
    selected: defaultOptionValues(formattedOptions),
  });

  // ===== VALIDATION =====
  const isMandatory = validation?.mandatory ?? false;
  const [validationStatus, setValidationStatus] = useState(
    validate(exposedVariablesTemporaryState.selected?.length ? exposedVariablesTemporaryState.selected : null)
  );
  const { isValid, validationError } = validationStatus;
  const [userInteracted, setUserInteracted] = useState(false);

  // ===== HELPER FUNCTIONS =====
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
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
      dep: exposedVariablesTemporaryState.selected,
      sideEffect: () => {
        setExposedVariable('selected', exposedVariablesTemporaryState.selected);
        const validationStatus = validate(
          exposedVariablesTemporaryState.selected?.length ? exposedVariablesTemporaryState.selected : null
        );
        setValidationStatus(validationStatus);
      },
    },
    {
      dep: validate,
      sideEffect: () => {
        const validationStatus = validate(
          exposedVariablesTemporaryState.selected?.length ? exposedVariablesTemporaryState.selected : null
        );
        setValidationStatus(validationStatus);
        setExposedVariable('isValid', validationStatus?.isValid);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      ...exposedVariablesTemporaryState,
      clear: async function () {
        updateExposedVariablesState('selected', []);
        setUserInteracted(true);
      },
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
  }, []);

  useEffect(() => {
    setExposedVariable('setSelected', async function (value) {
      if (Array.isArray(value)) {
        if (value.length === 0) updateExposedVariablesState('selected', []);

        const newSelected = value.filter((item) => validOptionValues.includes(item));

        if (multiSelection) {
          updateExposedVariablesState('selected', newSelected);
        } else {
          updateExposedVariablesState('selected', newSelected.length > 0 ? [newSelected[0]] : []);
        }
      } else if (typeof value === 'string' || typeof value === 'number') {
        const isValidValue = validOptionValues.includes(value);
        if (isValidValue) {
          updateExposedVariablesState('selected', [value]);
        }
      }
      setUserInteracted(true);
    });
  }, [multiSelection, validOptionValues, updateExposedVariablesState, setExposedVariable]);

  useEffect(() => {
    updateExposedVariablesState('selected', defaultOptionValues(formattedOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(options), JSON.stringify(schema), multiSelection]);

  const handleButtonClick = (value) => {
    const isSelected = exposedVariablesTemporaryState.selected.includes(value);
    if (multiSelection) {
      updateExposedVariablesState(
        'selected',
        isSelected
          ? exposedVariablesTemporaryState.selected.filter((item) => item !== value)
          : [...exposedVariablesTemporaryState.selected, value]
      );
    } else {
      updateExposedVariablesState('selected', isSelected ? [] : [value]);
    }
    fireEvent('onClick');
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
    height: `calc(100% - ${typeof label === 'string' && label !== '' ? '20px' : '0px'})`,
    ...(layout === 'column' && { justifyContent: justifyContentByAlignment }),
    overflow: layout === 'row' ? 'auto hidden' : 'hidden auto',
  };

  const commonStyles = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    border: `1px solid ${borderColor}`,
    transition: 'all .1s ease',
    boxShadow,
  };

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
        className={cx('button-group-widget')}
        style={{ height: _height }}
        aria-hidden={!exposedVariablesTemporaryState.isVisible}
        aria-disabled={exposedVariablesTemporaryState.isDisabled}
        role="group"
        id={`component-${id}`}
        aria-labelledby={`${id}-label`}
        data-cy={dataCy}
        data-disabled={exposedVariablesTemporaryState.isDisabled}
      >
        <Label
          label={label}
          width={width}
          labelRef={labelRef}
          darkMode={darkMode}
          color={'var(--cc-primary-text)'}
          direction={btnAlignment}
          defaultAlignment={'top'}
          isMandatory={isMandatory}
          id={`${id}-label`}
          dataCy={dataCy}
        />
        <div className="button-group-content-wrapper" style={groupWrapperStyles} ref={groupWrapperRef}>
          <div className="button-group-content" style={groupStyles} ref={groupRef}>
            {formattedOptions?.map((option, index) => (
              <button
                data-cy={`${dataCy}-button-${index}`}
                style={{
                  ...commonStyles,
                  ...(exposedVariablesTemporaryState.selected?.includes(option.value) && selectedStyles),
                  ...(option.isDisabled && disabledStyles),
                }}
                key={index}
                disabled={option.isDisabled}
                className={'button-group-button'}
                onClick={(event) => {
                  event.stopPropagation();
                  handleButtonClick(option.value);
                }}
              >
                {option.iconVisibility && (
                  <div className="tw-flex tw-w-[16px] tw-h-[16px] tw-shrink-0">
                    <TablerIcon
                      iconName={option.icon}
                      style={{
                        width: '16px',
                        height: '16px',
                        color: exposedVariablesTemporaryState.selected?.includes(option.value)
                          ? selectedIconColor
                          : iconColor,
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
        </div>
      </div>
      {userInteracted && exposedVariablesTemporaryState.isVisible && !isValid && (
        <div
          className="d-flex"
          style={{
            color: errTextColor,
            justifyContent: btnAlignment === 'right' ? 'flex-start' : 'flex-end',
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
