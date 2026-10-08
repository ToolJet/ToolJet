import React, { useEffect, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import cx from 'classnames';
import 'react-circular-progressbar/dist/styles.css';
import './circularProgressbar.scss';

export const CircularProgressBar = function CircularProgressBar({
  height,
  properties,
  styles,
  dataCy,
  setExposedVariable,
  setExposedVariables,
}) {
  const { text, progress, labelType, visibility, loadingState, allowNegativeProgress } = properties;
  const {
    color,
    textColor,
    textSize,
    strokeWidth,
    counterClockwise,
    circleRatio,
    boxShadow,
    trackColor,
    completionColor,
    alignment,
    negativeColor,
  } = styles;

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isLoading: loadingState,
    value: progress,
  });

  const label = labelType === 'custom' ? text : `${exposedVariablesTemporaryState.value}%`;
  const computedStyles = {
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
    boxShadow,
  };

  const innerContainerStyles = {
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
    justifyContent: alignment,
    width: '100%',
    height: '100%',
  };

  const computedProperties = exposedVariablesTemporaryState.isLoading
    ? {
        circleRatio: 1,
        value: 25,
        color: 'var(--cc-primary-brand)',
        text: ' ',
      }
    : {
        circleRatio: circleRatio,
        value: allowNegativeProgress
          ? Math.abs(exposedVariablesTemporaryState.value)
          : exposedVariablesTemporaryState.value,
        color:
          exposedVariablesTemporaryState.value >= 100
            ? completionColor
            : allowNegativeProgress
            ? exposedVariablesTemporaryState.value >= 0
              ? color
              : negativeColor
            : color,
        text: label,
      };

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  useEffect(() => {
    const exposedVariables = {
      isLoading: loadingState,
      isVisible: visibility,
      value: progress,
      setValue: async function (value) {
        setExposedVariable('value', value);
        updateExposedVariablesState('value', value);
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', value);
        updateExposedVariablesState('isVisible', value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', value);
        updateExposedVariablesState('isLoading', value);
      },
    };
    setExposedVariables(exposedVariables);
  }, []);

  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        setExposedVariable('isLoading', loadingState);
        updateExposedVariablesState('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
        updateExposedVariablesState('isVisible', visibility);
      },
    },
    {
      dep: progress,
      sideEffect: () => {
        setExposedVariable('value', progress);
        updateExposedVariablesState('value', progress);
      },
    },
  ]);

  return (
    <div style={computedStyles} data-cy={dataCy}>
      <div style={innerContainerStyles} className={cx({ 'rotate-forever': exposedVariablesTemporaryState.isLoading })}>
        <CircularProgressbar
          key={allowNegativeProgress && exposedVariablesTemporaryState.value < 0 ? 'negative' : 'positive'}
          value={computedProperties.value}
          text={computedProperties.text}
          styles={{
            root: {
              height: height,
            },
            path: {
              stroke: computedProperties.color,
            },
            text: {
              fill: textColor,
              fontSize: textSize,
            },
            trail: {
              stroke: trackColor,
            },
          }}
          strokeWidth={strokeWidth}
          counterClockwise={
            allowNegativeProgress && exposedVariablesTemporaryState.value < 0 ? !counterClockwise : counterClockwise
          }
          circleRatio={computedProperties.circleRatio}
        />
      </div>
    </div>
  );
};
