import React, { useEffect, useState } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';
import { Box, Step, StepButton, Stepper, Tooltip } from '@mui/material';

export const Steps = function Button({ properties, styles, fireEvent, setExposedVariable, height, darkMode, dataCy }) {
  const { stepsSelectable } = properties;
  const currentStep = isExpectedDataType(properties.currentStep, 'number');
  const steps = isExpectedDataType(properties.steps, 'array');
  const { color, theme, visibility, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [activeStep, setActiveStep] = useState(null);

  useEffect(() => {
    setActiveStep(currentStep - 1);
    setExposedVariable('currentStepId', currentStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex);
  };

  return (
    visibility && (
      <>
        <Box sx={{ width: '100%' }}>
          <Stepper
            alternativeLabel
            disabled={stepsSelectable}
            activeStep={activeStep}
            style={{ height, boxShadow }}
            sx={{
              '& .MuiStepLabel-label.MuiStepLabel-alternativeLabel': { color: textColor },
            }}
          >
            {steps.map((item, index) => (
              <Tooltip
                arrow
                key={item.id}
                title={item.tooltip}
                placement="top"
              >
                <Step
                  key={item.id}
                  completed={index < activeStep}
                >
                  <StepButton
                    onClick={() => handleStepClick(index)}
                    disabled={!stepsSelectable}
                    sx={{
                      '& .MuiStepIcon-text': { display: theme === 'plain' ? 'none' : '' },
                      '& .MuiStepIcon-root.Mui-active': { color: color },
                      '& .MuiStepIcon-root.Mui-completed': { color: color },
                    }}
                  >
                    {theme === 'titles' ? item.name : ''}
                  </StepButton>
                </Step>
              </Tooltip>
            ))}
          </Stepper>
        </Box>
      </>
    )
  );
};
