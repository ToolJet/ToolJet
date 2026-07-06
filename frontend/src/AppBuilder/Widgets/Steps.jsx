import React, { useEffect, useMemo, useRef } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';
import { ToolTip } from '@/_components/ToolTip';
import './Steps.scss';
import { getFormattedSteps, getSafeRenderableValue } from './utils';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/wave4';

const sanitizeSteps = (steps) => {
  const formattedSteps = getFormattedSteps(steps);
  return JSON.parse(JSON.stringify(formattedSteps || [])).map((step) => ({
    ...step,
    visible: 'visible' in step ? step.visible : true,
    disabled: 'disabled' in step ? step.disabled : false,
  }));
};

export const Steps = function Steps({
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  height,
  darkMode,
  dataCy,
  id,
  componentType,
  moduleId,
  resolveIndex,
}) {
  const { stepsSelectable, disabledState } = properties;
  const visibility = isExpectedDataType(properties.visibility, 'boolean');
  const currentStepId = isExpectedDataType(properties.currentStep, 'number');
  const isDynamicStepsEnabled = isExpectedDataType(properties.advanced, 'boolean');
  const steps = isDynamicStepsEnabled ? properties.schema : properties.steps;
  const { color, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const { completedAccent, incompletedAccent, incompletedLabel, completedLabel, currentStepLabel } = styles;
  const theme = properties.variant;
  const firstLabelRef = useRef(null);
  const lastLabelRef = useRef(null);
  const containerRef = useRef(null);
  const isInitialRender = useRef(true);
  // Local-render state only — progress-bar geometry, never exposed.
  const [progressBarWidth, setProgressBarWidth] = React.useState(0);
  const [containerPadding, setContainerPadding] = React.useState(0);

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for isVisible/isDisabled/currentStepId/steps;
  // the resolved properties (sanitized the same way the old mount/property
  // effects did) are the pre-first-publish fallback.
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);
  const activeStepId = useExposedVariable(id, 'currentStepId', exposedOpts, currentStepId);
  const stepsArr = useExposedVariable(id, 'steps', exposedOpts, undefined) ?? sanitizeSteps(steps);

  const filteredSteps = useMemo(() => (stepsArr || []).filter((step) => step.visible), [stepsArr]);
  const currentStepIndex = filteredSteps.findIndex((step) => step.id == activeStepId);

  // Latest-ref: the exposed `setStep` CSA (registered once at mount) must
  // never close over a stale disabledState from the mount-time render — its
  // guard reads the resolved PROPERTY, not exposed isDisabled (old behavior).
  const disabledStateRef = useRef(disabledState);
  disabledStateRef.current = disabledState;

  // Not isInitialRender-gated — matches old (unconditional resanitize on
  // steps change, idempotent on mount since it's also the pre-publish
  // fallback formula above).
  useEffect(() => {
    setExposedVariables({ steps: sanitizeSteps(steps) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(steps)]);

  // Common function to calculate progress bar width and label padding
  const calculateProgressBarWidth = () => {
    if (!containerRef.current || theme !== 'titles') return;

    const containerWidth = containerRef.current.offsetWidth;

    const stepWidth = 20; // width of dot + padding
    const totalStepsWidth = filteredSteps.length * stepWidth;
    const totalProgressBars = filteredSteps.length - 1;

    if (filteredSteps.length === 1) {
      setProgressBarWidth(containerWidth);
      setContainerPadding(0); // No padding needed for single step
      return;
    }

    // Calculate progress bar width
    const progressBarWidth = (containerWidth - totalStepsWidth) / totalProgressBars;
    setProgressBarWidth(Math.min(progressBarWidth, (containerWidth - totalStepsWidth) / filteredSteps.length));

    // Calculate container padding
    if (firstLabelRef.current && lastLabelRef.current) {
      const firstLabelWidth = firstLabelRef.current.offsetWidth;
      const lastLabelWidth = lastLabelRef.current.offsetWidth;
      const maxLabelWidth = Math.max(firstLabelWidth, lastLabelWidth);

      const calculatedPadding = maxLabelWidth / 2 - 1;
      setContainerPadding(Math.max(2, calculatedPadding)); // Ensure minimum padding of 2px
    }
  };

  // Add resize observer to track container width and calculate progress bar width
  useEffect(() => {
    calculateProgressBarWidth();
    if (theme !== 'titles') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        calculateProgressBarWidth();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, JSON.stringify(steps), filteredSteps]);

  // Dynamic styles for theming
  const dynamicStyle = {
    '--bgColor': styles.color,
    '--textColor': textColor,
    '--completedAccent': completedAccent === '#4368E3' ? 'var(--primary-brand)' : completedAccent,
    '--incompletedAccent': incompletedAccent === '#E4E7EB' ? 'var(--surfaces-surface-03)' : incompletedAccent,
    '--incompletedLabel': incompletedLabel === '#1B1F24' ? 'var(--text-primary)' : incompletedLabel,
    '--completedLabel': completedLabel === '#1B1F24' ? 'var(--text-primary)' : completedLabel,
    '--currentStepLabel': currentStepLabel === '#1B1F24' ? 'var(--text-primary)' : currentStepLabel,
  };

  // Step click handler — guards against the exposed isDisabled (old
  // behavior; the exposed `setStep` CSA below guards against the resolved
  // disabledState prop instead — two different guard sources, preserved).
  const handleStepClick = (stepId) => {
    const step = filteredSteps.find((item) => item.id == stepId);
    if (step && !step.disabled && !isDisabled) {
      dispatch([
        { kind: 'INVOKE_CSA', componentId: id, action: 'setStep', args: [step.id] },
        { kind: 'FIRE_EVENT', componentId: id, event: 'onSelect' },
      ]);
    }
  };

  // Property-sync write-throughs (skip-initial).
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('currentStepId', currentStepId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepId]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // (setStep overridden to guard against the resolved disabledState prop,
  // matching old exactly).
  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      currentStepId: currentStepId,
      steps: sanitizeSteps(steps),
      ...csaShims(),
      setStep: async (stepId) => {
        if (!disabledStateRef.current)
          dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'setStep', args: [stepId] }]);
      },
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`steps-container ${isDisabled ? 'disabled' : ''} ${filteredSteps.length === 1 ? 'single-step' : ''}`}
      style={{
        height,
        display: isVisible ? 'flex' : 'none',
        boxShadow,
        padding: theme === 'titles' ? `0 ${containerPadding}px` : 2,
        paddingTop: theme === 'plain' ? `3px` : theme === 'numbers' ? `2px` : 0,
        ...dynamicStyle,
      }}
      aria-hidden={!isVisible}
      aria-disabled={disabledState}
      role="navigation"
      id={`component-${id}`}
      aria-label="Steps"
      data-cy={dataCy}
    >
      <div className={`progress-line-container ${filteredSteps.length === 1 ? 'single-step' : ''}`}>
        {filteredSteps.map((step, index) => {
          const isStepDisabled = step.disabled;
          const isStepVisible = step.visible;
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          const isFirstStep = index === 0;
          const isLastStep = index === filteredSteps.length - 1;

          return (
            <React.Fragment key={index}>
              {' '}
              {/* using index as key to avoid issues due to duplicate step ids */}
              <ToolTip
                show={!step.disabled && !isDisabled && step.tooltip}
                message={getSafeRenderableValue(step.tooltip || '')}
              >
                <div
                  onClick={() => stepsSelectable && handleStepClick(step.id)}
                  className={`milestone ${theme === 'numbers' ? 'numbers' : ''} ${
                    isDisabled || isStepDisabled ? 'disabled' : ''
                  } ${isCompleted ? 'completed' : isActive ? 'active' : 'incomplete'}`}
                >
                  {theme === 'numbers' ? (
                    index + 1
                  ) : (
                    <>
                      <div
                        className={`dot ${isCompleted ? 'completed' : isActive ? 'active' : 'incomplete'}`}
                        style={{
                          border: `2px solid ${
                            isCompleted ? completedAccent : isActive ? completedAccent : incompletedAccent
                          }`,
                          backgroundColor: isActive ? 'transparent' : isCompleted ? completedAccent : incompletedAccent,
                        }}
                        aria-hidden={!isStepVisible}
                        aria-disabled={isStepDisabled}
                        aria-current={isActive ? 'step' : undefined}
                      />
                      {theme === 'titles' && (
                        <div
                          ref={isFirstStep ? firstLabelRef : isLastStep ? lastLabelRef : null}
                          className={`label ${isCompleted ? 'completed' : isActive ? 'active' : 'incomplete'}`}
                          style={{ maxWidth: `${progressBarWidth}px` }}
                        >
                          <span id={`${id}-option-${index}-label`}>{getSafeRenderableValue(step.name)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ToolTip>
              {index < filteredSteps.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'completed' : 'incomplete'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
