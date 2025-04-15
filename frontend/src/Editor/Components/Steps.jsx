import React, { useEffect, useState, useRef } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';
import { ToolTip } from '@/_components/ToolTip';
import './Steps.scss';

export const Steps = function Steps({ properties, styles, fireEvent, setExposedVariable, height, darkMode, dataCy }) {
  const { stepsSelectable, disabledState } = properties;
  const visibility = isExpectedDataType(properties.visibility, 'boolean');
  const currentStepId = isExpectedDataType(properties.currentStep, 'number');
  const isDynamicStepsEnabled = isExpectedDataType(properties.advanced, 'boolean');
  const steps = isDynamicStepsEnabled ? properties.schema : properties.steps;
  const { color, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const { completedAccent, incompletedAccent, incompletedLabel, completedLabel, currentStepLabel } = styles;
  const [stepsArr, setStepsArr] = useState(steps);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const [activeStepId, setActiveStepId] = useState(currentStepId);
  const theme = properties.variant;
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [labelPadding, setLabelPadding] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const firstLabelRef = useRef(null);
  const lastLabelRef = useRef(null);
  const containerRef = useRef(null);

  // Common function to calculate progress bar width and label padding
  const calculateProgressBarWidth = () => {
    if (!containerRef.current || theme !== 'titles') return;

    const containerWidth = containerRef.current.offsetWidth;
    setContainerWidth(containerWidth);

    const stepWidth = 20; // width of dot + padding
    const totalStepsWidth = filteredSteps.length * stepWidth;
    const totalProgressBars = filteredSteps.length - 1;

    if (filteredSteps.length === 1) {
      setProgressBarWidth(containerWidth);
      setLabelPadding(0); // No padding needed for single step
      return;
    }

    // Calculate progress bar width
    const progressBarWidth = (containerWidth - totalStepsWidth) / totalProgressBars;
    setProgressBarWidth(Math.min(progressBarWidth, (containerWidth - totalStepsWidth) / filteredSteps.length));

    // Calculate label padding
    if (firstLabelRef.current && lastLabelRef.current) {
      // Step 1: Calculate individual label width
      const labelWidth = (containerWidth - (filteredSteps.length - 1) - 4) / filteredSteps.length;

      // Step 2: Find max label length
      const firstLabelWidth = firstLabelRef.current.offsetWidth;
      const lastLabelWidth = lastLabelRef.current.offsetWidth;
      const maxLabelWidth = Math.max(firstLabelWidth, lastLabelWidth);

      // Step 3: Calculate label padding
      const calculatedPadding = (maxLabelWidth / 2) - 1;
      setLabelPadding(Math.max(2, calculatedPadding)); // Ensure minimum padding of 2px
    }
  };

  // Add resize observer to track container width and calculate progress bar width
  useEffect(() => {
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
  }, [theme, JSON.stringify(steps)]);

  // Recalculate measurements when steps change
  useEffect(() => {
    calculateProgressBarWidth();
  }, [theme, JSON.stringify(steps)]);

  // Filter visible steps and find current step index
  const filteredSteps = (stepsArr || []).filter((step) => step.visible);
  const currentStepIndex = filteredSteps.findIndex((step) => step.id == activeStepId);

  // Sanitize steps data
  useEffect(() => {
    const sanitizedSteps = JSON.parse(JSON.stringify(steps || [])).map((step) => ({
      ...step,
      visible: 'visible' in step ? step.visible : true,
      disabled: 'disabled' in step ? step.disabled : false,
    }));
    setStepsArr(sanitizedSteps);
  }, [JSON.stringify(steps)]);

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

  // Step click handler
  const handleStepClick = (id) => {
    const step = filteredSteps.find((item) => item.id == id);
    if (step && !step.disabled && !isDisabled) {
      setActiveStepId(step.id);
      fireEvent('onSelect');
    }
  };

  // Expose variables and methods
  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
    setExposedVariable('isDisabled', isDisabled);
    setExposedVariable('currentStepId', activeStepId);
    setExposedVariable('steps', stepsArr);

    setExposedVariable('setStepVisible', (stepId, visibility) => {
      setStepsArr((prev) => {
        const updatedSteps = prev.map((item) =>
          item.id == stepId ? { ...item, visible: visibility } : item
        );
        setExposedVariable('steps', updatedSteps);
        return updatedSteps;
      });
    });

    setExposedVariable('setStepDisable', (stepId, disabled) => {
      setStepsArr((prev) => {
        const updatedSteps = prev.map((item) =>
          item.id == stepId ? { ...item, disabled: disabled } : item
        );
        setExposedVariable('steps', updatedSteps);
        return updatedSteps;
      });
    });

    setExposedVariable('resetSteps', () => {
      setActiveStepId(stepsArr.filter((step) => step.visible)?.[0]?.id);
    });

    setExposedVariable('setStep', (stepId) => {
      if (!disabledState) setActiveStepId(stepId);
    });
    setExposedVariable('setVisibility', (visibility) => setIsVisible(visibility));
    setExposedVariable('setDisable', (disabled) => setIsDisabled(disabled));
  }, [isVisible, isDisabled, activeStepId, stepsArr, disabledState]);

  // Update state from props
  useEffect(() => setIsVisible(visibility), [visibility]);
  useEffect(() => setIsDisabled(disabledState), [disabledState]);
  useEffect(() => setActiveStepId(currentStepId), [currentStepId]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={`steps-container ${isDisabled ? 'disabled' : ''} ${filteredSteps.length === 1 ? 'single-step' : ''}`}
      style={{
        height,
        boxShadow,
        padding: theme === 'titles' ? `0 ${labelPadding}px` : 0,
        ...dynamicStyle
      }}
      data-cy={dataCy}
    >
      <div className={`progress-line-container ${filteredSteps.length === 1 ? 'single-step' : ''}`}>
        {filteredSteps.map((step, index) => {
          const isStepDisabled = step.disabled;
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          const isFirstStep = index === 0;
          const isLastStep = index === filteredSteps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <ToolTip
                show={!step.disabled && !isDisabled}
                message={step.tooltip || ''}
              >
                <div
                  onClick={() => stepsSelectable && handleStepClick(step.id)}
                  className={`milestone ${theme === 'numbers' ? 'numbers' : ''} ${isDisabled || isStepDisabled ? 'disabled' : ''
                    } ${isCompleted ? 'completed' : isActive ? 'active' : 'incomplete'}`}
                >
                  {theme === 'numbers' ? (
                    index + 1
                  ) : (
                    <>
                      <div
                        className={`dot ${isCompleted ? 'completed' : isActive ? 'active' : 'incomplete'}`}
                        style={{
                          border: `2px solid ${isCompleted ? completedAccent : isActive ? completedAccent : incompletedAccent}`,
                          backgroundColor: isActive ? 'white' : (isCompleted ? completedAccent : incompletedAccent)
                        }}
                      />
                      {theme === 'titles' && (
                        <div
                          ref={isFirstStep ? firstLabelRef : isLastStep ? lastLabelRef : null}
                          className={`label ${isCompleted ? 'completed' : isActive ? 'active' : 'incomplete'}`}
                          style={{ maxWidth: `${progressBarWidth}px` }}
                        >
                          {step.name}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ToolTip>

              {index < filteredSteps.length - 1 && (
                <div
                  className={`step-connector ${isCompleted ? 'completed' : 'incomplete'}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
