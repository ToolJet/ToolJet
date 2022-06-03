import React, { useEffect, useState } from 'react';

export const Steps = function Button({ properties, styles, fireEvent, setExposedVariable }) {
  const { currentStep, stepsSelectable, steps } = properties;
  const { color, theme, visibility } = styles;

  const [activeStep, setActiveStep] = useState(null);

  const activeStepHandler = (id) => {
    const active = steps.filter((item) => item.id == id);
    setExposedVariable('currentStepId', active[0].id).then(() => fireEvent('onSelect'));
    setActiveStep(active[0].id);
  };

  useEffect(() => {
    setActiveStep(currentStep);
    setExposedVariable('currentStepId', currentStep).then(() => fireEvent('onSelect'));
  }, [currentStep]);

  return (
    visibility && (
      <div className={`steps ${theme == 'numbers' && 'steps-counter '}`}>
        {steps?.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`step-item ${item.id == activeStep && 'active'}  ${color && `step-${color}`}`}
            data-bs-toggle="tooltip"
            title={item?.tooltip}
            onClick={() => stepsSelectable && activeStepHandler(item.id)}
            style={{ color: '#656d77' }}
          >
            {theme == 'titles' && item.name}
          </a>
        ))}
      </div>
    )
  );
};
