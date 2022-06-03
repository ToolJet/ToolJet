import React, { useEffect, useState } from 'react';

export const Steps = function Button({ height, properties, styles, fireEvent, setExposedVariable }) {
  const { currentStep, stepsSelectable, steps } = properties;
  const { color, theme, visibility, disabledState } = styles;

  const [activeStep, setActiveStep] = useState(null);

  const activeStepHandler = (id) => {
    const active = steps.filter((item) => item.id == id);
    console.log(active);
    setActiveStep(active[0].id);
  };

  useEffect(() => {
    console.log('step', activeStep, currentStep);
  }, [activeStep]);

  return (
    visibility && (
      <div className={`steps steps-widget ${theme == 'numbers' && 'steps-counter '}`}>
        {steps.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`step-item ${(activeStep ? item.id == activeStep : item.id == currentStep) && 'active'}`}
            data-bs-toggle="tooltip"
            title="Step 1 description"
            onClick={() => stepsSelectable && activeStepHandler(item.id)}
          >
            {theme == 'titles' && item.name}
          </a>
        ))}
      </div>
    )
  );
};
