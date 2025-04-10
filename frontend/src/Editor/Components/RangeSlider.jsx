import React, { useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Spinner from '@/_ui/Spinner';
export const RangeSlider = ({
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
  const {
    value,
    min,
    max,
    enableTwoHandle,
    label,
    schema,
    endValue,
    startValue,
    disabledState,
    loadingState,
    visibility,
  } = properties;
  console.log(properties);

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
  // const [visibility, setVisibility] = useState(properties.visibility);
  const [disabled, setDisabled] = useState(properties?.disabledState);
  const [loading, setLoading] = useState(properties?.loadingState);

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const _width = auto ? 'auto' : `${(width / 100) * 70}%`;

  const toArray = (data) => (Array.isArray(data) ? data : [data, max]);
  const singleHandleValue = !enableTwoHandle ? (Array.isArray(value) ? value[0] : value) : 50;
  const twoHandlesArray = enableTwoHandle ? toArray(value) : [0, 100];

  useEffect(() => {
    if (auto) {
      setLabelWidth('auto');
    } else {
      setLabelWidth(width > 0 ? `${width}%` : '33%');
    }
  }, [auto, width]);

  useEffect(() => {
    const exposedVariables = {
      setValue: async function (value) {
        setDefaultSliderValue(value);
        setExposedVariable('value', value);
        fireEvent('onChange');
      },
      setRangeValue: async function (num1, num2) {
        setDefaultRangeValue([num1, num2]);
        setExposedVariable('value', [num1, num2]);
        fireEvent('onChange');
      },
      // <- HAVE COMMENTED THIS FUNCTION FOR YOUR REFERENCE ->
      // setVisibility: async function (value) {
      //   setVisibility(value);
      //   setExposedVariable('isVisible', value);
      // },
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
    setExposedVariable('reset', () => {
      if (enableTwoHandle === 'slider') {
        setDefaultSliderValue(value ?? min);
        setExposedVariable('value', value ?? min);
      } else {
        const start = startValue ?? min;
        const end = endValue ?? max;
        setExposedVariable('value', [start, end]);
        setDefaultRangeValue([start, end]);
      }
    });
  }, [min, max, startValue, endValue]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (enableTwoHandle === 'slider') {
      setDefaultSliderValue(value);
    } else {
      const start = startValue ?? min;
      const end = endValue ?? max;

      setDefaultRangeValue([start, end]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enableTwoHandle, startValue, endValue]);

  const onSliderChange = (value) => {
    console.log({ value });
    setExposedVariable('value', value);
    setDefaultSliderValue(value);
  };

  const onRangeChange = (value) => {
    console.log({ value });
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

  const Label = ({ label, color, defaultAlignment, direction }) => {
    if (!label) return null;

    return (
      <div
        ref={labelRef}
        style={{
          color,
          width: _width,
          marginRight: defaultAlignment === 'side' && direction === 'left' ? '4px' : '0px',
          marginLeft: defaultAlignment === 'side' && direction === 'right' ? '4px' : '0px',
          marginBottom: defaultAlignment === 'top' ? '4px' : '0px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: direction === 'right' ? 'right' : 'left',
          minWidth: defaultAlignment === 'side' ? '40px' : 'auto',
          maxWidth: defaultAlignment === 'side' ? '50%' : '100%',
          lineHeight: '1.2',
          fontSize: '12px',
          fontWeight: '500',
        }}
      >
        {label}
      </div>
    );
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
    ...(disabledState && {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.5,
    }),
    visibility: visibility ? 'visible' : 'hidden',
  };

  const sliderContainerStyle = {
    width: '100%',
    paddingRight: '12px',
    visibility: visibility ? 'visible' : 'hidden',
  };
  return (
    <div style={containerStyle} className="range-slider" data-cy={dataCy}>
      {loadingState ? (
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
          <Label label={label} color={color} defaultAlignment={defaultAlignment} direction={direction} />

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
                marks={schema.reduce((acc, item) => {
                  acc[item.value] = {
                    style: { color: markerLabel },
                    label: item.label.replace('%', ''),
                  };
                  return acc;
                }, {})}
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
                marks={schema.reduce((acc, item) => {
                  acc[item.value] = {
                    style: { color: markerLabel },
                    label: item.label.replace('%', ''),
                  };
                  return acc;
                }, {})}
                handleRender={(node, handleProps) => {
                  return (
                    <OverlayTrigger placement="top" overlay={<Tooltip>{handleProps.value}</Tooltip>}>
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
