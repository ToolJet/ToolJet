import React, { useState, useEffect } from 'react';
import Label from '@/_ui/Label';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import './progressbar.scss';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
export const ProgressBar = ({ id, properties, styles, setExposedVariable, setExposedVariables, dataCy, height }) => {
  // ===== PROPS DESTRUCTURING =====
  const { labelType, label, progress, visibility, loadingState } = properties;

  const {
    textColor,
    alignment,
    direction,
    width: labelWidth,
    auto,
    trackColor,
    progressTrackColor,
    completionColor,
    progressBarThickness,
    boxShadow,
    textSize,
    padding,
  } = styles;

  // ===== COMPUTED VALUES =====
  const computedHeight = padding !== 'none' ? height - 2 * BOX_PADDING : height;

  // Calculate font size as percentage of component height (textSize: 1-100, default 26)
  const validTextSize = textSize >= 1 && textSize <= 50 ? textSize : 26;
  const fontSize = `${(computedHeight * validTextSize) / 100}px`;

  // Calculate progress bar height as percentage of component height (progressBarThickness: 1-100, default 20)
  const validProgressBarThickness = progressBarThickness >= 1 && progressBarThickness <= 50 ? progressBarThickness : 20;
  const barHeight = (computedHeight * validProgressBarThickness) / 100;

  // ===== STATE MANAGEMENT =====
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    value: Math.min(Math.max(progress || 0, 0), 100),
    isVisible: visibility,
    isLoading: loadingState,
  });

  // Clamp progress value between 0 and 100
  const clampedProgress = exposedVariablesTemporaryState.value;
  const isCompleted = clampedProgress >= 100;

  // Determine label text
  const labelText = labelType === 'custom' ? label : `${Math.round(clampedProgress)}%`;

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
      dep: progress,
      sideEffect: () => {
        const clamped = Math.min(Math.max(progress || 0, 0), 100);
        updateExposedVariablesState('value', clamped);
        setExposedVariable('value', clamped);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
  ]);

  useEffect(() => {
    const exposedVariables = {
      value: Math.min(Math.max(progress || 0, 0), 100),
      isVisible: visibility,
      isLoading: loadingState,
      setValue: async function (value) {
        const clamped = Math.min(Math.max(value || 0, 0), 100);
        updateExposedVariablesState('value', clamped);
        setExposedVariable('value', clamped);
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

  if (!exposedVariablesTemporaryState.isVisible) {
    return null;
  }

  // ===== COMPUTED STYLES =====
  // Determine progress bar color
  const progressColor = isCompleted ? completionColor : progressTrackColor;

  // Label styles for top alignment
  const labelContainerStyles =
    alignment === 'top'
      ? {
          width: '100%',
          display: 'flex',
          justifyContent: direction === 'right' ? 'flex-end' : 'flex-start',
          alignItems: alignment === 'top' ? 'flex-end' : 'center',
          height: '50%',
          flexShrink: 0,
        }
      : {};

  // Container styles
  const containerStyles = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: alignment === 'top' ? 'column' : 'row',
    alignItems: alignment === 'top' ? 'flex-start' : 'center',
    ...(alignment === 'side' && direction === 'right' && { flexDirection: 'row-reverse' }),
    boxShadow,
  };

  // Progress bar container styles
  const progressBarContainerStyles = {
    display: 'flex',
    alignItems: alignment === 'top' ? 'flex-start' : 'center',
    flex: 1,
    width: '100%',
    height: alignment === 'top' ? '50%' : '100%',
  };

  // Progress bar wrapper styles
  const progressBarWrapperStyles = {
    width: '100%',
    height: `${barHeight}px`,
    backgroundColor: trackColor,
    borderRadius: `${barHeight / 2}px`,
    overflow: 'hidden',
  };

  // ===== MAIN RENDER =====
  const labelElement = (
    <Label
      label={labelText}
      width={labelWidth}
      color={textColor}
      defaultAlignment={alignment === 'top' ? 'side' : alignment}
      direction={direction}
      auto={auto}
      _width={labelWidth}
      inputId={`component-${id}`}
      id={`${id}-label`}
      fontSize={fontSize}
    />
  );

  return (
    <div style={containerStyles} data-cy={dataCy} id={id}>
      {alignment === 'top' ? <div style={labelContainerStyles}>{labelElement}</div> : labelElement}
      <div style={progressBarContainerStyles}>
        <div style={progressBarWrapperStyles}>
          {exposedVariablesTemporaryState.isLoading ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '21%',
                  height: '100%',
                  backgroundColor: progressTrackColor,
                  borderRadius: `${barHeight / 2}px`,
                  animation: 'progressLoading 1.5s ease-in-out infinite',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: `${clampedProgress}%`,
                height: '100%',
                backgroundColor: progressColor,
                transition: 'width 0.3s ease, background-color 0.3s ease',
                borderRadius: `${barHeight / 2}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
