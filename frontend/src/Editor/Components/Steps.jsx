import React, { useEffect, useState } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';
import { ToolTip } from '@/_components/ToolTip';

export const Steps = function Button({ properties, styles, fireEvent, setExposedVariable, height, darkMode, dataCy }) {
  const { stepsSelectable: disabledState } = properties;
  const visibility = isExpectedDataType(properties.visibility, 'boolean');
  const currentStepId = isExpectedDataType(properties.currentStep, 'number');
  const isDynamicStepsEnabled = isExpectedDataType(properties.advanced, 'boolean');
  const steps = isDynamicStepsEnabled ? properties.schema : properties.steps;
  const { color, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const { completedAccent, incompletedAccent, incompletedLabel, completedLabel, currentStepLabel } = styles;
  const [stepsArr, setStepsArr] = useState(steps);
  const [isVisible, setIsVisible] = useState(visibility);
  const [isDisabled, setIsDisabled] = useState(!disabledState);
  const [activeStepId, setActiveStepId] = useState(currentStepId);
  const filteredSteps = (stepsArr || []).filter((step) => step.visible);
  const currentStepIndex = filteredSteps.findIndex((step) => step.id == activeStepId);

  useEffect(() => {
    // this is required for legacy support where visible  and disabled properties are not present
    const sanitizedSteps = JSON.parse(JSON.stringify(steps || [])).map((step) => {
      if (!('visible' in step)) step.visible = true;
      if (!('disabled' in step)) step.disabled = false;
      return step;
    });
    setStepsArr(sanitizedSteps);
  }, [JSON.stringify(steps)]);

  const dynamicStyle = {
    '--bgColor': styles.color,
    '--textColor': textColor,
    '--completedAccent': completedAccent === '#4368E3' ? 'var(--primary-brand)' : completedAccent,
    '--incompletedAccent': incompletedAccent === '#E4E7EB' ? 'var(--surfaces-surface-03)' : incompletedAccent,
    '--incompletedLabel': incompletedLabel === '#1B1F24' ? 'var(--text-primary)' : incompletedLabel,
    '--completedLabel': completedLabel === '#1B1F24' ? 'var(--text-primary)' : completedLabel,
    '--currentStepLabel': currentStepLabel === '#1B1F24' ? 'var(--text-primary)' : currentStepLabel,
  };
  const theme = properties.variant;
  const activeStepHandler = (id) => {
    const step = filteredSteps.find((item) => item.id == id);
    if (step) {
      setActiveStepId(step.id);
      fireEvent('onSelect');
    }
  };

  useEffect(() => {
    setExposedVariable('setStep', (stepId) => setActiveStepId(stepId));
    setExposedVariable('setVisibility', (visibility) => setIsVisible(visibility));
    setExposedVariable('setDisabled', (disabled) => setIsDisabled(disabled));
  }, []);

  useEffect(() => {
    setExposedVariable('currentStepId', activeStepId);
  }, [activeStepId]);

  useEffect(() => {
    setExposedVariable('steps', steps);
    setExposedVariable('setStepVisible', (stepId, visibility) => {
      setStepsArr((prev) => {
        const updatedSteps = prev.map((item) => {
          if (item.id == stepId) {
            return { ...item, visible: visibility };
          }
          return item;
        });
        setExposedVariable('steps', updatedSteps);
        return updatedSteps;
      });
    });
    setExposedVariable('setStepDisable', (stepId, disabled) => {
      setStepsArr((prev) => {
        const updatedSteps = prev.map((item) => {
          if (item.id == stepId) {
            return { ...item, disabled: disabled };
          }
          return item;
        });
        setExposedVariable('steps', updatedSteps);
        return updatedSteps;
      });
    });
    setExposedVariable('resetSteps', () => {
      setActiveStepId(stepsArr.filter((step) => step.visible)?.[0]?.id);
    });
  }, [JSON.stringify(steps), JSON.stringify(stepsArr)]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
  }, [isVisible]);

  useEffect(() => {
    setIsVisible(visibility);
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('isDisabled', isDisabled);
  }, [isDisabled]);

  useEffect(() => {
    setIsDisabled(!disabledState);
  }, [disabledState]);

  return (
    isVisible && (
      <div
        className={`steps ${theme == 'numbers' && 'steps-counter '}`}
        style={{ color: textColor, height, boxShadow, opacity: isDisabled ? 0.5 : 1 }}
        data-cy={dataCy}
      >
        {filteredSteps?.map((item, index) => {
          const isStepDisabled = item.disabled;
          return (
            <ToolTip
              key={item.id + index + item.name}
              show={!item.disabled && !isDisabled}
              message={item.tooltip || ''}
            >
              <a
                className={`step-item ${item.id == activeStepId && 'active'} ${
                  !(!isDisabled && !isStepDisabled) && 'step-item-disabled'
                }  ${color && `step-${color}`} ${
                  index < currentStepIndex
                    ? 'completed-label'
                    : index == currentStepIndex
                    ? 'active-label'
                    : 'incompleted-label'
                }`}
                data-bs-toggle="tooltip"
                title={item?.tooltip}
                onClick={() => !isDisabled && !isStepDisabled && activeStepHandler(item.id)}
                style={dynamicStyle}
              >
                {theme == 'titles' && (item.name?.length > 12 ? item.name.slice(0, 12) + '...' : item.name)}
              </a>
            </ToolTip>
          );
        })}
      </div>
    )
  );
};
