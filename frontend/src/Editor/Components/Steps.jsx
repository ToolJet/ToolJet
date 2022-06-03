import React, { useEffect, useState } from 'react';

export const Steps = function Button({ height, properties, styles, fireEvent, setExposedVariable }) {
  const { currentStep, stepsSelectable, steps } = properties;
  const { color, theme, visibility, disabledState } = styles;

  const [activeStep, setActiveStep] = useState();

  const activeStepHandler = (id) => {
    const active = steps.filter((item) => item.id == id);
    console.log(active);
    setActiveStep(active[0].id);
  };

  useEffect(() => {
    console.log('step', activeStep);
  }, [activeStep]);

  return (
    <div className={`steps steps-widget`}>
      {steps.map((item) => (
        <a
          key={item.id}
          href="#"
          className={`step-item ${item.id == activeStep && 'active'}`}
          data-bs-toggle="tooltip"
          title="Step 1 description"
          onClick={() => stepsSelectable && activeStepHandler(item.id)}
        >
          {item.name}
        </a>
      ))}
    </div>
  );
};
