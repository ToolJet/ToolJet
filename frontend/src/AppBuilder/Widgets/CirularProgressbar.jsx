import React, { useEffect } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import cx from 'classnames';
import 'react-circular-progressbar/dist/styles.css';
import './circularProgressbar.scss';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const CircularProgressBar = function CircularProgressBar({
  id,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariables,
  fireEvent,
  componentType,
  moduleId,
  resolveIndex,
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

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const value = useExposedVariable(id, 'value', exposedOpts, progress);

  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  const label = labelType === 'custom' ? text : `${value}%`;
  const computedStyles = {
    display: isVisible ? 'flex' : 'none',
    boxShadow,
  };

  const innerContainerStyles = {
    display: isVisible ? 'flex' : 'none',
    justifyContent: alignment,
    width: '100%',
    height: '100%',
  };

  const computedProperties = isLoading
    ? {
        circleRatio: 1,
        value: 25,
        color: 'var(--cc-primary-brand)',
        text: ' ',
      }
    : {
        circleRatio: circleRatio,
        value: allowNegativeProgress ? Math.abs(value) : value,
        color: value >= 100 ? completionColor : allowNegativeProgress ? (value >= 0 ? color : negativeColor) : color,
        text: label,
      };

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setValue/setVisibility/setLoading) ─────────────────────────────────── */
  useEffect(() => {
    setExposedVariables({
      isLoading: loadingState,
      isVisible: visibility,
      value: progress,
      ...csaShims(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Property-change write-throughs (skip-initial via the batched hook) ── */
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => setExposedVariables({ isLoading: loadingState }),
    },
    {
      dep: visibility,
      sideEffect: () => setExposedVariables({ isVisible: visibility }),
    },
    {
      dep: progress,
      sideEffect: () => setExposedVariables({ value: progress }),
    },
  ]);

  return (
    <div style={computedStyles} data-cy={dataCy}>
      <div style={innerContainerStyles} className={cx({ 'rotate-forever': isLoading })}>
        <CircularProgressbar
          key={allowNegativeProgress && value < 0 ? 'negative' : 'positive'}
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
          counterClockwise={allowNegativeProgress && value < 0 ? !counterClockwise : counterClockwise}
          circleRatio={computedProperties.circleRatio}
        />
      </div>
    </div>
  );
};
