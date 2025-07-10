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
    type,
    label,
    schema,
    endValue,
    startValue,
    visibility,
    disabledState,
    loadingState,
    stepSize,
    enableTwoHandle,
  } = properties;

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

  const [newSliderValue, setNewSliderValue] = useState(value);
  const [newRangeValue, setNewRangeValue] = useState([startValue, endValue]);
  const [newVisibility, setNewVisibility] = useState(visibility);
  const [newDisabled, setNewDisabled] = useState(disabledState);
  const [newLoading, setNewLoading] = useState(loadingState);

  const [legacyValue, setLegacyValue] = useState(properties.value);

  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const _width = auto ? 'auto' : `${(width / 100) * 70}%`;

  const toArray = (data) => (Array.isArray(data) ? data : [data, max]);

  useEffect(() => {
    if (type === 'legacy') {
      setExposedVariables({
        value: legacyValue,
        label: null,
        isVisible: null,
        isDisabled: null,
        isLoading: null,
        setValue: null,
        setRangeValue: null,
        setVisibility: null,
        setDisable: null,
        setLoading: null,
        reset: null,
      });
    } else {
      const currentExposedValue = type === 'slider' ? newSliderValue : newRangeValue;
      const exposedVariables = {
        value: currentExposedValue,
        label: label,
        isVisible: newVisibility,
        isDisabled: newDisabled,
        isLoading: newLoading,

        setValue: async function (val) {
          setNewSliderValue(val);
          setExposedVariable('value', val);
          fireEvent('onChange');
        },
        setRangeValue: async function (num1, num2) {
          setNewRangeValue([num1, num2]);
          setExposedVariable('value', [num1, num2]);
          fireEvent('onChange');
        },
        setVisibility: async function (val) {
          setNewVisibility(val);
          setExposedVariable('isVisible', val);
        },
        setDisable: async function (val) {
          setNewDisabled(val);
          setExposedVariable('isDisabled', val);
        },
        setLoading: async function (val) {
          setNewLoading(val);
          setExposedVariable('isLoading', val);
        },
        reset: () => {
          if (type === 'slider') {
            setNewSliderValue(value ?? min);
            setExposedVariable('value', value ?? min);
          } else {
            const start = startValue ?? min;
            const end = endValue ?? max;
            setExposedVariable('value', [start, end]);
            setNewRangeValue([start, end]);
          }
        },
      };
      setExposedVariables(exposedVariables);
    }

    if (isInitialRender.current) {
      if (type === 'legacy') {
        setLegacyValue(value);
      } else {
        if (type === 'slider') {
          setNewSliderValue(value);
        } else {
          setNewRangeValue([startValue, endValue]);
        }
      }
    }
    isInitialRender.current = false;
  }, [
    type,
    value,
    startValue,
    endValue,
    min,
    max,
    legacyValue,
    properties.value,
    label,
    newVisibility,
    newDisabled,
    newLoading,
    newSliderValue,
    newRangeValue,
  ]);

  useEffect(() => {
    if (type !== 'legacy') {
      newDisabled !== disabledState && setNewDisabled(disabledState);
    }
  }, [disabledState, newDisabled, type]);

  useEffect(() => {
    if (type !== 'legacy') {
      newVisibility !== visibility && setNewVisibility(visibility);
    }
  }, [visibility, newVisibility, type]);

  useEffect(() => {
    if (type !== 'legacy') {
      newLoading !== loadingState && setNewLoading(loadingState);
    }
  }, [loadingState, newLoading, type]);

  useEffect(() => {
    if (type !== 'legacy') {
      newLoading !== loadingState && setNewLoading(loadingState);
    }
  }, [loadingState, newLoading, type]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (type === 'slider') {
      setNewSliderValue(value);
      setExposedVariable('value', value);
    }
  }, [value, type]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (type === 'rangeSlider') {
      setNewRangeValue([startValue, endValue]);
      setExposedVariable('value', [startValue, endValue]);
    }
  }, [startValue, endValue, type]);

  // This useEffect ensures that when the 'type' changes, the value reflected
  // in the exposed variable is immediately updated to match the active slider type.
  useEffect(() => {
    if (isInitialRender.current) return; // Skip on initial render
    if (type === 'legacy') {
      // For legacy, use properties.value (initial value) as base
      setLegacyValue(properties.value);
      setExposedVariable('value', properties.value);
    } else if (type === 'slider') {
      // For single slider, use the newSliderValue state
      setNewSliderValue(value ?? min); // Reset to default or min if changing type
      setExposedVariable('value', value ?? min);
    } else if (type === 'rangeSlider') {
      // For range slider, use the newRangeValue state
      const start = startValue ?? min;
      const end = endValue ?? max;
      setNewRangeValue([start, end]); // Reset to default or min/max if changing type
      setExposedVariable('value', [start, end]);
    }
  }, [type, value, startValue, endValue, min, max, properties.value]);

  const onNewSliderChange = (val) => {
    setExposedVariable('value', val);
    setNewSliderValue(val);
  };

  const onNewRangeChange = (val) => {
    setExposedVariable('value', val);
    setNewRangeValue(val);
  };

  const onLegacyChange = (val) => {
    console.log({ val }, 'happening');
    setExposedVariable('value', val);
    setLegacyValue(val);
  };

  const commonRangeStyles = {
    handleStyle: (val) => {
      const currentVal = Array.isArray(val) ? val : [val];
      return currentVal.map(() => ({
        backgroundColor: `${handleColor}`,
        borderColor: handleBorderColor,
        border: `1px solid ${handleBorderColor}`,
        height: 16,
        width: 16,
        opacity: 1,
      }));
    },
    trackStyle: (val) => {
      const currentVal = Array.isArray(val) ? val : [val];
      return currentVal.map(() => ({
        backgroundColor: trackColor,
        height: 8,
      }));
    },
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
    if (type === 'legacy' || !label) return null;

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
    height,
    display: (type === 'legacy' ? visibility : newVisibility) ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: type === 'legacy' ? '0px 2px' : styles.padding === 'none' ? '0px' : '0px',
    boxShadow,
    width: '100%',
    ...(type !== 'legacy' && {
      flexDirection: defaultAlignment === 'top' ? 'column' : 'row',
      alignItems: defaultAlignment === 'top' ? (direction === 'right' ? 'flex-end' : 'flex-start') : 'center',
      justifyContent: 'flex-start',
      height: defaultAlignment === 'top' ? 'auto' : height,
      gap: '0px',
      ...(defaultAlignment === 'side' && direction === 'right' && { flexDirection: 'row-reverse' }),
      ...(newDisabled && {
        pointerEvents: 'none',
        cursor: 'not-allowed',
        opacity: 0.5,
      }),
      visibility: newVisibility ? 'visible' : 'hidden',
    }),
  };

  const sliderContainerStyle = {
    width: '100%',
    paddingRight: type === 'legacy' ? '0px' : '12px',
    visibility: (type === 'legacy' ? visibility : newVisibility) ? 'visible' : 'hidden',
  };

  if (type === 'legacy') {
    return (
      <div style={containerStyle} className="range-slider" data-cy={dataCy}>
        {enableTwoHandle ? (
          <Slider
            range
            min={min}
            max={max}
            defaultValue={toArray(properties.value)}
            onChange={onLegacyChange}
            onAfterChange={() => fireEvent('onChange')}
            value={toArray(legacyValue)}
            ref={sliderRef}
            trackStyle={commonRangeStyles.trackStyle(legacyValue)}
            railStyle={commonRangeStyles.railStyle}
            handleStyle={commonRangeStyles.handleStyle(legacyValue)}
          />
        ) : (
          <Slider
            min={min}
            max={max}
            defaultValue={Array.isArray(properties.value) ? properties.value[0] : properties.value}
            value={legacyValue}
            ref={sliderRef}
            onChange={onLegacyChange}
            onAfterChange={() => fireEvent('onChange')}
            trackStyle={commonRangeStyles.trackStyle(legacyValue)}
            railStyle={commonRangeStyles.railStyle}
            handleStyle={commonRangeStyles.handleStyle(legacyValue)}
          />
        )}
      </div>
    );
  } else {
    return (
      <div style={containerStyle} className="range-slider" data-cy={dataCy}>
        {newLoading ? (
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
              {type === 'rangeSlider' ? (
                <Slider
                  range
                  min={min}
                  max={max}
                  defaultValue={newRangeValue}
                  onChange={onNewRangeChange}
                  onAfterChange={() => fireEvent('onChange')}
                  value={newRangeValue}
                  ref={sliderRef}
                  step={stepSize}
                  trackStyle={commonRangeStyles.trackStyle(newRangeValue)}
                  railStyle={commonRangeStyles.railStyle}
                  handleStyle={commonRangeStyles.handleStyle(newRangeValue)}
                  dotStyle={commonRangeStyles.dotStyle}
                  activeDotStyle={commonRangeStyles.activeDotStyle}
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
                  defaultValue={newSliderValue}
                  value={newSliderValue}
                  ref={sliderRef}
                  onChange={onNewSliderChange}
                  onAfterChange={() => fireEvent('onChange')}
                  step={stepSize}
                  trackStyle={commonRangeStyles.trackStyle(newSliderValue)}
                  railStyle={commonRangeStyles.railStyle}
                  handleStyle={commonRangeStyles.handleStyle(newSliderValue)}
                  dotStyle={commonRangeStyles.dotStyle}
                  activeDotStyle={commonRangeStyles.activeDotStyle}
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
  }
};
