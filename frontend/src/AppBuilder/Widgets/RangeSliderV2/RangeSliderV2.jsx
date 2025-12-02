import React, { useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Spinner from '@/_ui/Spinner';
import Label from '@/_ui/Label';
import './styles.scss';


export const RangeSliderV2 = ({
  height,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  dataCy,
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
  } = styles;

  const sliderRef = useRef(null);

  const [defaultSliderValue, setDefaultSliderValue] = useState(value);
  const [defaultRangeValue, setDefaultRangeValue] = useState([startValue, endValue]);
  const [labelWidth, setLabelWidth] = useState(auto ? 'auto' : width);
  // <- HAVE COMMENTED THIS VARIABLE FOR YOUR REFERENCE ->
  const [visibility, setVisibility] = useState(properties.visibility);
  const [disabled, setDisabled] = useState(properties?.disabledState);
  const [loading, setLoading] = useState(properties?.loadingState);

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const _width = auto ? 'auto' : `${(width / 100) * 70}%`;

  const toArray = (data) => (Array.isArray(data) ? data : [data, max]);
  const singleHandleValue = !enableTwoHandle ? (Array.isArray(value) ? value[0] : value) : 50;
  const twoHandlesArray = enableTwoHandle ? toArray(value) : [0, 100];

  const resetFn = async () => {
    let defaultValue;
    if (enableTwoHandle === 'slider') {
      defaultValue = value ?? min;
      setDefaultSliderValue(defaultValue);
    } else {
      const start = startValue ?? min;
      const end = endValue ?? max;
      defaultValue = [start, end];
      setDefaultRangeValue(defaultValue);
    }
    setExposedVariable('value', defaultValue);
  };

  useEffect(() => {
    if (auto) {
      setLabelWidth('auto');
    } else {
      // setLabelWidth(width > 0 ? `${width}%` : '33%');
      setLabelWidth((width / 100) * 70);
    }
  }, [auto, width]);

  useEffect(() => {
    const exposedVariables = {
      label: label,
      isLoading: properties?.loadingState,
      isVisible: properties?.visibility,
      isDisabled: properties?.disabledState,
      setValue: async function (value) {
        setDefaultSliderValue(value);
        setExposedVariable('value', Number(value));
        fireEvent('onChange');
      },
      setRangeValue: async function (num1, num2) {
        setDefaultRangeValue([num1, num2]);
        setExposedVariable('value', [num1, num2]);
        fireEvent('onChange');
      },
      setVisibility: async function (value) {
        setVisibility(!!value);
        setExposedVariable('isVisible', !!value);
      },
      setDisable: async function (value) {
        setDisabled(value);
        setExposedVariable('isDisabled', value);
      },
      setLoading: async function (value) {
        setLoading(value);
        setExposedVariable('isLoading', value);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    if (isInitialRender.current) return;
    resetFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enableTwoHandle, startValue, endValue]);

  useEffect(() => {
    setExposedVariable('reset', resetFn);
  }, [enableTwoHandle, value, min, max, startValue, endValue]);

  useEffect(() => {
    if (disabled !== properties.disabledState) setDisabled(properties.disabledState);
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (loading !== properties.loadingState) setLoading(properties.loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.disabledState, properties.visibility, properties.loadingState]);

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
    setDefaultSliderValue(value);
  };

  const onRangeChange = (value) => {
    setExposedVariable('value', value);
    setDefaultRangeValue(value);
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

  // const Label = ({ label, color, defaultAlignment, direction }) => {
  //   if (!label) return null;

  //   return (
  //     <div
  //       ref={labelRef}
  //       style={{
  //         color,
  //         width: _width,
  //         marginRight: defaultAlignment === 'side' && direction === 'left' ? '4px' : '0px',
  //         marginLeft: defaultAlignment === 'side' && direction === 'right' ? '4px' : '0px',
  //         marginBottom: defaultAlignment === 'top' ? '4px' : '0px',
  //         whiteSpace: 'nowrap',
  //         overflow: 'hidden',
  //         textOverflow: 'ellipsis',
  //         textAlign: direction === 'right' ? 'right' : 'left',
  //         minWidth: defaultAlignment === 'side' ? '40px' : 'auto',
  //         maxWidth: defaultAlignment === 'side' ? '50%' : '100%',
  //         lineHeight: '1.2',
  //         fontSize: '12px',
  //         fontWeight: '500',
  //       }}
  //     >
  //       {label}
  //     </div>
  //   );
  // };

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
    width: '100%',
    visibility: visibility ? 'visible' : 'hidden',
  };
  return (
    <div style={containerStyle} className="range-slider" data-cy={dataCy}>
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
          <Label label={label} auto={auto} width={width} _width={labelWidth} color={color} defaultAlignment={defaultAlignment} direction={direction} />

          <div style={sliderContainerStyle}>
            {enableTwoHandle !== 'slider' ? (
              <Slider
                range
                min={min}
                max={max}
                defaultValue={defaultRangeValue}
                onChange={onRangeChange}
                onAfterChange={() => fireEvent('onChange')}
                value={defaultRangeValue}
                ref={sliderRef}
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
                min={min}
                max={max}
                defaultValue={defaultSliderValue}
                value={defaultSliderValue}
                ref={sliderRef}
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