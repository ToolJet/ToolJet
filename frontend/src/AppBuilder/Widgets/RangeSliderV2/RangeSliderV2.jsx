import React, { useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Spinner from '@/_ui/Spinner';
import Label from '@/_ui/Label';
import './styles.scss';
import {
  getLabelFontSize,
  getWidthTypeOfComponentStyles,
  getLabelWidthOfInput,
} from '../BaseComponents/hooks/useInput';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

export const RangeSliderV2 = ({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  dataCy,
  id,
  componentType,
  moduleId,
  resolveIndex,
}) => {
  const isInitialRender = useRef(true);
  const labelRef = useRef(null);
  const { value, min, max, enableTwoHandle, label, schema, endValue, startValue, stepSize } = properties;

  const {
    trackColor,
    handleColor,
    lineColor,
    boxShadow,
    alignment = 'side',
    direction = 'left',
    width = 0,
    auto = false,
    color = '#000',
    markerLabel,
    handleBorderColor,
    widthType,
    labelFontSize,
  } = styles;

  const labelFontSizeValue = getLabelFontSize(labelFontSize);

  const sliderRef = useRef(null);

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for the exposed value; the resolved
  // properties are the pre-first-publish fallback (old defaultSliderValue/
  // defaultRangeValue useState — old code never republished `value` at
  // mount, relying on the resolved-property fallback the same way).
  const storeValue = useExposedVariable(id, 'value', exposedOpts, undefined);
  const defaultSliderValue = storeValue !== undefined ? storeValue : value;
  const defaultRangeValue = storeValue !== undefined ? storeValue : [startValue, endValue];

  const [labelWidth, setLabelWidth] = useState(auto ? 'auto' : width);
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const disabled = useExposedVariable(id, 'isDisabled', exposedOpts, properties?.disabledState);
  const loading = useExposedVariable(id, 'isLoading', exposedOpts, properties?.loadingState);

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';

  const toArray = (data) => (Array.isArray(data) ? data : [data, max]);
  const singleHandleValue = !enableTwoHandle ? (Array.isArray(value) ? value[0] : value) : 50;
  const twoHandlesArray = enableTwoHandle ? toArray(value) : [0, 100];

  const resetFn = async () => {
    let defaultValue;
    if (enableTwoHandle === 'slider') {
      defaultValue = value ?? min;
    } else {
      const start = startValue ?? min;
      const end = endValue ?? max;
      defaultValue = [start, end];
    }
    setExposedVariable('value', defaultValue);
  };

  useEffect(() => {
    if (auto) {
      setLabelWidth('auto');
    } else {
      setLabelWidth(getLabelWidthOfInput(widthType, width));
    }
  }, [auto, width, widthType]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // (setValue/setRangeValue overridden to keep the old unconditional
  // onChange-firing semantics; `value` itself is not published here — matches
  // old, which relied on the resolved-property read fallback until the user
  // interacts, calls a CSA, or a non-initial prop change triggers resetFn).
  useEffect(() => {
    setExposedVariables({
      label: label,
      isLoading: properties?.loadingState,
      isVisible: properties?.visibility,
      isDisabled: properties?.disabledState,
      ...csaShims(),
      setValue: async function (value) {
        dispatch([
          { kind: 'INVOKE_CSA', componentId: id, action: 'setValue', args: [value] },
          { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
        ]);
      },
      setRangeValue: async function (num1, num2) {
        dispatch([
          { kind: 'INVOKE_CSA', componentId: id, action: 'setRangeValue', args: [num1, num2] },
          { kind: 'FIRE_EVENT', componentId: id, event: 'onChange' },
        ]);
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialRender.current) return;
    resetFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enableTwoHandle, startValue, endValue]);

  useEffect(() => {
    setExposedVariable('reset', resetFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableTwoHandle, value, min, max, startValue, endValue]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', properties.loadingState);
  }, [properties.loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', properties.disabledState);
  }, [properties.disabledState]);

  const onSliderChange = (value) => {
    setExposedVariable('value', value);
  };

  const onRangeChange = (value) => {
    setExposedVariable('value', value);
  };

  const rangeStyles = {
    handleStyle: toArray(defaultRangeValue).map(() => ({
      backgroundColor: `${handleColor}`,
      borderColor: handleColor,
      border: `1px solid ${handleBorderColor}`,
      height: 16,
      width: 16,
      opacity: 1,
    })),
    trackStyle: toArray(defaultRangeValue).map(() => ({
      backgroundColor: trackColor,
      height: 8,
    })),
    railStyle: { backgroundColor: lineColor, height: 8 },
    dotStyle: {
      width: 4,
      height: 4,
      backgroundColor: '#ffffff',
      borderColor: '#ffffff',
    },
    activeDotStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#ffffff',
    },
  };

  const containerStyle = {
    display: visibility ? 'flex' : 'none',
    flexDirection: defaultAlignment === 'top' ? 'column' : 'row',
    alignItems: defaultAlignment === 'top' ? (direction === 'right' ? 'flex-end' : 'flex-start') : 'center',
    justifyContent: 'flex-start',
    padding: '0px',
    boxShadow,
    width: '100%',
    height: defaultAlignment === 'top' ? 'auto' : height,
    gap: '0px',
    ...(defaultAlignment === 'side' && direction === 'right' && { flexDirection: 'row-reverse' }),
    ...(disabled && {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.5,
    }),
    visibility: visibility ? 'visible' : 'hidden',
  };

  const sliderContainerStyle = {
    ...getWidthTypeOfComponentStyles(widthType, width, auto, defaultAlignment),
    visibility: visibility ? 'visible' : 'hidden',
  };
  return (
    <div
      style={containerStyle}
      className="range-slider"
      data-cy={dataCy}
      aria-hidden={!visibility}
      aria-disabled={disabled}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
          }}
        >
          <Spinner />
        </div>
      ) : (
        <>
          <Label
            label={label}
            auto={auto}
            width={width}
            _width={labelWidth}
            color={color}
            defaultAlignment={defaultAlignment}
            direction={direction}
            widthType={widthType}
            inputId={`component-${id}`}
            id={`${id}-label`}
            fontSize={labelFontSizeValue}
          />

          <div style={sliderContainerStyle}>
            {enableTwoHandle !== 'slider' ? (
              <Slider
                range
                disabled={disabled}
                min={min}
                max={max}
                defaultValue={defaultRangeValue}
                onChange={onRangeChange}
                onAfterChange={() => fireEvent('onChange')}
                value={defaultRangeValue}
                ref={sliderRef}
                id={`component-${id}`}
                ariaLabelledByForHandle={`${id}-label`}
                ariaLabelForHandle={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
                trackStyle={rangeStyles.trackStyle}
                railStyle={rangeStyles.railStyle}
                handleStyle={rangeStyles.handleStyle}
                dotStyle={rangeStyles.dotStyle}
                activeDotStyle={rangeStyles.activeDotStyle}
                marks={(Array.isArray(schema) ? schema : []).reduce((acc, item) => {
                  if (item && typeof item === 'object' && item.value !== undefined && item.label !== undefined) {
                    const maxValue = typeof max === 'number' ? max : Number(max);
                    const itemValue = Number(item.value);

                    if (!isNaN(maxValue) && !isNaN(itemValue) && itemValue <= maxValue) {
                      acc[item.value] = {
                        style: { color: markerLabel },
                        label: String(item.label).replace('%', ''),
                      };
                    }
                  }
                  return acc;
                }, {})}
                step={stepSize || 1}
                handleRender={(node, handleProps) => {
                  return (
                    <OverlayTrigger placement="top" overlay={<Tooltip>{handleProps.value}</Tooltip>}>
                      {node}
                    </OverlayTrigger>
                  );
                }}
              />
            ) : (
              <Slider
                disabled={disabled}
                min={min}
                max={max}
                defaultValue={defaultSliderValue}
                value={defaultSliderValue}
                ref={sliderRef}
                id={`component-${id}`}
                ariaLabelledByForHandle={`${id}-label`}
                ariaLabelForHandle={!auto && labelWidth == 0 && label?.length != 0 ? label : undefined}
                onChange={onSliderChange}
                onAfterChange={() => fireEvent('onChange')}
                trackStyle={rangeStyles.trackStyle}
                railStyle={rangeStyles.railStyle}
                handleStyle={rangeStyles.handleStyle}
                dotStyle={rangeStyles.dotStyle}
                activeDotStyle={rangeStyles.activeDotStyle}
                marks={(Array.isArray(schema) ? schema : []).reduce((acc, item) => {
                  if (item && typeof item === 'object' && item.value !== undefined && item.label !== undefined) {
                    const maxValue = typeof max === 'number' ? max : Number(max);
                    const itemValue = Number(item.value);

                    if (!isNaN(maxValue) && !isNaN(itemValue) && itemValue <= maxValue) {
                      acc[item.value] = {
                        style: { color: markerLabel },
                        label: String(item.label).replace('%', ''),
                      };
                    }
                  }
                  return acc;
                }, {})}
                step={stepSize || 1}
                handleRender={(node, handleProps) => {
                  return (
                    <OverlayTrigger
                      show={handleProps.dragging}
                      placement="top"
                      overlay={<Tooltip key={handleProps.value}>{handleProps.value}</Tooltip>}
                    >
                      {node}
                    </OverlayTrigger>
                  );
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
