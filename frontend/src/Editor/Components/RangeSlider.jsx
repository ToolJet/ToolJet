import React, { useEffect, useRef, useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export const RangeSlider = ({ height, properties, styles, setExposedVariable, fireEvent, dataCy }) => {
  const isInitialRender = useRef(true);
  const labelRef = useRef(null);
  const { value, min, max, enableTwoHandle, label, schema, endValue, startValue, visibility } = properties;
  console.log(schema);

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

  const [sliderValue, setSliderValue] = useState(
    endValue !== undefined ? endValue : Array.isArray(value) ? value[0] : value || 0
  );
  const [rangeValue, setRangeValue] = useState([0, 100]);
  const [labelWidth, setLabelWidth] = useState(auto ? 'auto' : width);

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const _width = auto ? 'auto' : `${(width / 100) * 70}%`;

  const toArray = (data) => (Array.isArray(data) ? data : [data, max]);
  const singleHandleValue = !enableTwoHandle ? (Array.isArray(value) ? value[0] : value) : 50;
  const twoHandlesArray = enableTwoHandle ? toArray(value) : [0, 100];

  useEffect(() => {
    if (endValue !== undefined) {
      // Update sliderValue to match endValue whenever endValue changes
      setSliderValue(endValue);
      setExposedVariable('value', endValue);
    }
  }, [endValue]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (endValue === undefined) {
      setSliderValue(singleHandleValue);
      setExposedVariable('value', singleHandleValue);
    }
  }, [singleHandleValue]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setRangeValue(twoHandlesArray);
    setExposedVariable('value', twoHandlesArray);
  }, [JSON.stringify(twoHandlesArray)]);

  useEffect(() => {
    setExposedVariable(
      'value',
      enableTwoHandle ? twoHandlesArray : endValue !== undefined ? endValue : singleHandleValue
    );
    if (isInitialRender.current) {
      enableTwoHandle
        ? setRangeValue(twoHandlesArray)
        : setSliderValue(endValue !== undefined ? endValue : singleHandleValue);
    }
    isInitialRender.current = false;
  }, [enableTwoHandle]);

  useEffect(() => {
    if (auto) {
      setLabelWidth('auto');
    } else {
      setLabelWidth(width > 0 ? `${width}%` : '33%');
    }
  }, [auto, width]);

  const onSliderChange = (value) => {
    setExposedVariable('value', value);
    setSliderValue(value);
  };

  const onRangeChange = (value) => {
    setExposedVariable('value', value);
    setRangeValue(value);
  };

  const rangeStyles = {
    handleStyle: toArray(sliderValue).map(() => ({
      backgroundColor: handleColor,
      borderColor: handleColor,
    })),
    trackStyle: toArray(sliderValue).map(() => ({
      backgroundColor: trackColor,
    })),
    railStyle: { backgroundColor: lineColor },
  };

  const Label = ({ label, color, defaultAlignment, direction }) => {
    if (!label) return null;

    return (
      <div
        ref={labelRef}
        style={{
          color,
          width: labelWidth,
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
  };

  const sliderContainerStyle = {
    width: '100%',
  };

  return (
    <div style={containerStyle} className="range-slider" data-cy={dataCy}>
      <Label label={label} color={color} defaultAlignment={defaultAlignment} direction={direction} />
      <div style={sliderContainerStyle}>
        {enableTwoHandle !== 'slider' ? (
          <>
            <style>
              {`
    .rc-slider-handle {
      opacity: 1 !important;
      
    }
      .rc-slider-dot-active {
  border-color: transparent !important;
}
  .rc-slider-dot {
      border: none;
      height:4px;
      width:4px;
      bottom:0px;
    }
  `}
            </style>
            <Slider
              range
              min={min}
              max={max}
              defaultValue={toArray(rangeValue)}
              onChange={onRangeChange}
              onAfterChange={() => fireEvent('onChange')}
              value={toArray(rangeValue)}
              ref={sliderRef}
              trackStyle={rangeStyles.trackStyle}
              railStyle={rangeStyles.railStyle}
              handleStyle={[
                { backgroundColor: handleColor, border: `1px solid ${handleBorderColor}` },
                { backgroundColor: handleColor, border: `1px solid ${handleBorderColor}` },
              ]}
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
          </>
        ) : (
          <>
            <style>
              {`
    .rc-slider-handle {
      opacity: 1 !important;
      
    }
      .rc-slider-dot-active {
  border-color: transparent !important;
}
 .rc-slider-dot {
      border: none;
      height:4px;
      width:4px;
      bottom:0px;
    }

  `}
            </style>
            <Slider
              min={min}
              max={max}
              defaultValue={endValue !== undefined ? endValue : sliderValue}
              value={sliderValue}
              ref={sliderRef}
              onChange={onSliderChange}
              onAfterChange={() => fireEvent('onChange')}
              startPoint={startValue}
              // trackStyle={{ backgroundColor: trackColor }}
              // railStyle={{ backgroundColor: lineColor }}
              trackStyle={rangeStyles.trackStyle}
              railStyle={rangeStyles.railStyle}
              handleStyle={[
                { backgroundColor: handleColor, border: `1px solid ${handleBorderColor}` },
                { backgroundColor: handleColor, border: `1px solid ${handleBorderColor}` },
              ]}
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
          </>
        )}
      </div>
    </div>
  );
};
