import React, { useEffect, useState } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';

export const Steps = function Button({ properties, styles, fireEvent, setExposedVariable, height, darkMode, dataCy }) {
  const { stepsSelectable } = properties;
  const currentStep = isExpectedDataType(properties.currentStep, 'number');
  const steps = isExpectedDataType(properties.steps, 'array');
  const { color, theme, visibility, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [activeStep, setActiveStep] = useState(null);

  const dynamicStyle = {
    '--bgColor': styles.color,
    '--textColor': textColor,
  };
  const activeStepHandler = (id) => {
    const active = steps.filter((item) => item.id == id);
    setExposedVariable('currentStepId', active[0].id).then(() => fireEvent('onSelect'));
    setActiveStep(active[0].id);
  };

  useEffect(() => {
    setActiveStep(currentStep);
    setExposedVariable('currentStepId', currentStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex);
  };

  return (
    visibility && (
      <div
        className={`steps ${theme == 'numbers' && 'steps-counter '}`}
        style={{ color: textColor, height, boxShadow }}
        data-cy={dataCy}
      >
        {steps?.map((item) => (
          <a
            key={item.id}
            className={`step-item ${item.id == activeStep && 'active'} ${!stepsSelectable && 'step-item-disabled'}  ${
              color && `step-${color}`
            }`}
            data-bs-toggle="tooltip"
            title={item?.tooltip}
            onClick={() => stepsSelectable && activeStepHandler(item.id)}
            style={dynamicStyle}
          >
            {theme == 'titles' && item.name}
          </a>
        ))}
      </div>
    )
  );
};
