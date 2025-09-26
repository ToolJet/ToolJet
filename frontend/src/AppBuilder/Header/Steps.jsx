import React, { Children } from 'react';

import { cn } from '@/lib/utils';
import CheckCircle from '@/_ui/Icon/solidIcons/CheckCircle';
import SolidArrow from '@/_ui/Icon/solidIcons/SolidArrow';
import DottedArrow from '@/_ui/Icon/solidIcons/DottedArrow';

function Step({ stepNo, label, active, completed }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1">
      {completed ? (
        <CheckCircle />
      ) : (
        <span
          className={cn(
            'tw-bg-text-placeholder tw-text-white tw-text-[0.625rem] tw-rounded-full tw-size-3.5 tw-flex tw-justify-center tw-items-center',
            { '!tw-bg-black': active }
          )}
        >
          {stepNo}
        </span>
      )}

      <p
        className={cn('tw-text-base tw-text-text-placeholder tw-font-medium tw-mb-0', {
          'tw-text-text-primary': completed || active,
        })}
      >
        {label}
      </p>
    </div>
  );
}

function Connector({ completed }) {
  if (completed) return <SolidArrow />;

  return <DottedArrow />;
}

// sequential steps
export default function Steps({ steps, activeStep }) {
  const activeStepIndex = steps.findIndex((step) => step.value === activeStep);
  const currentStepIdx = activeStepIndex === -1 ? 0 : activeStepIndex;

  return (
    <div className="tw-flex tw-items-center tw-gap-1 tw-py-2">
      {Children.toArray(
        steps.map((step, index) => {
          const isActive = index === currentStepIdx;
          const isCompleted = index < currentStepIdx;

          return (
            <>
              <Step stepNo={index + 1} label={step.label} active={isActive} completed={isCompleted} />

              {index < steps.length - 1 && <Connector completed={isCompleted} />}
            </>
          );
        })
      )}
    </div>
  );
}
