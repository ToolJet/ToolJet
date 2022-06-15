import React, { useEffect, useState } from 'react';

export const Steps = function Button({ properties, styles, fireEvent, setExposedVariable, height }) {
  const { currentStep, stepsSelectable, steps } = properties;
  const { color, theme, visibility } = styles;

  const [activeStep, setActiveStep] = useState(null);

  const dynamicStyle = {
    '--bgColor': styles.color,
    '--textColor': styles.textColor,
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

  return (
    visibility && (
      <div
        className={`steps ${theme == 'numbers' && 'steps-counter '}`}
        style={{ color: `${styles.textColor}`, height }}
      >
        {steps?.map((item) => (
          <a
            key={item.id}
            href="#"
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
