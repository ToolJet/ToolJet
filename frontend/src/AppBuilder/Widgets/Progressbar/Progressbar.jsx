import React, { useEffect } from 'react';
import Label from '@/_ui/Label';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import './progressbar.scss';
import { BOX_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/displayA';

export const ProgressBar = ({
  id,
  properties,
  styles,
  setExposedVariables,
  fireEvent,
  dataCy,
  height,
  componentType,
  moduleId,
  resolveIndex,
}) => {
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

  /* ── Controlled reads: store is the source of truth ───────────────────── */
  const exposedOpts = { resolveIndex, moduleId };
  const clampedProgress = useExposedVariable(id, 'value', exposedOpts, Math.min(Math.max(progress || 0, 0), 100));
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);

  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  const isCompleted = clampedProgress >= 100;

  // Determine label text
  const labelText = labelType === 'custom' ? label : `${Math.round(clampedProgress)}%`;

  /* ── Property-change write-throughs (skip-initial via the batched hook) ── */
  useBatchedUpdateEffectArray([
    {
      dep: progress,
      sideEffect: () => setExposedVariables({ value: Math.min(Math.max(progress || 0, 0), 100) }),
    },
    {
      dep: visibility,
      sideEffect: () => setExposedVariables({ isVisible: visibility }),
    },
    {
      dep: loadingState,
      sideEffect: () => setExposedVariables({ isLoading: loadingState }),
    },
  ]);

  /* ── Mount snapshot: initial exposed values + contract CSA dispatchers
     (setValue/setVisibility/setLoading) ─────────────────────────────────── */
  useEffect(() => {
    setExposedVariables({
      value: Math.min(Math.max(progress || 0, 0), 100),
      isVisible: visibility,
      isLoading: loadingState,
      ...csaShims(),
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isVisible) {
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
          {isLoading ? (
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
