import React, { useState, useEffect, useRef } from 'react';
import Label from '@/_ui/Label';

export const ProgressBar = ({ id, properties, styles, setExposedVariable, setExposedVariables, dataCy, height }) => {
  const isInitialRender = useRef(true);

  // Properties
  const { labelType, text, progress, visibility: initialVisibility } = properties;

  // Styles
  const {
    textColor,
    alignment,
    direction,
    width: labelWidth,
    auto,
    trackColor,
    progressTrackColor,
    completionColor,
    progressBarWidth,
    boxShadow,
    textSize,
  } = styles;

  // Calculate font size as percentage of component height (textSize: 1-100, default 26)
  const validTextSize = textSize >= 1 && textSize <= 100 ? textSize : 26;
  const fontSize = `${(height * validTextSize) / 100}px`;

  // Calculate progress bar height as percentage of component height (progressBarWidth: 1-100, default 20)
  const validProgressBarWidth = progressBarWidth >= 1 && progressBarWidth <= 100 ? progressBarWidth : 20;
  const barHeight = (height * validProgressBarWidth) / 100;

  // State
  const [visibility, setVisibility] = useState(initialVisibility);
  const [progressValue, setProgressValue] = useState(progress);

  // Clamp progress value between 0 and 100
  const clampedProgress = Math.min(Math.max(progressValue || 0, 0), 100);
  const isCompleted = clampedProgress >= 100;

  // Determine label text
  const labelText = labelType === 'custom' ? text : `${Math.round(clampedProgress)}%`;

  // Update visibility when properties change
  useEffect(() => {
    if (visibility !== initialVisibility) setVisibility(initialVisibility);
  }, [initialVisibility]);

  // Update progress when properties change
  useEffect(() => {
    setProgressValue(progress);
  }, [progress]);

  // Expose variables after initial render
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      setExposedVariables({
        value: clampedProgress,
        isVisible: visibility,
        setValue: async (value) => setProgressValue(value),
        setVisibility: async (value) => setVisibility(value),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update exposed variables when they change
  useEffect(() => {
    if (!isInitialRender.current) {
      setExposedVariable('value', clampedProgress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedProgress]);

  useEffect(() => {
    if (!isInitialRender.current) {
      setExposedVariable('isVisible', visibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  if (!visibility) {
    return null;
  }

  // Determine progress bar color
  const progressColor = isCompleted ? completionColor : progressTrackColor;

  // Container styles
  const containerStyles = {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: alignment === 'top' ? 'column' : 'row',
    alignItems: alignment === 'top' ? 'stretch' : 'center',
    ...(alignment === 'side' && direction === 'right' && { flexDirection: 'row-reverse' }),
    boxShadow,
  };

  // Progress bar container styles
  const progressBarContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    flex: alignment === 'side' ? 1 : 'none',
    width: alignment === 'top' ? '100%' : 'auto',
  };

  // Progress bar wrapper styles
  const progressBarWrapperStyles = {
    width: '100%',
    height: `${barHeight}px`,
    backgroundColor: trackColor,
    borderRadius: `${barHeight / 2}px`,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyles} data-cy={dataCy} id={id}>
      <Label
        label={labelText}
        width={labelWidth}
        color={textColor}
        defaultAlignment={alignment}
        direction={direction}
        auto={auto}
        _width={labelWidth}
        inputId={`component-${id}`}
        id={`${id}-label`}
        fontSize={fontSize}
      />
      <div style={progressBarContainerStyles}>
        <div style={progressBarWrapperStyles}>
          <div
            style={{
              width: `${clampedProgress}%`,
              height: '100%',
              backgroundColor: progressColor,
              transition: 'width 0.3s ease, background-color 0.3s ease',
              borderRadius: `${barHeight / 2}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
