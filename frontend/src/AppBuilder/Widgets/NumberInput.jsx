import React, { useEffect } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { cn } from '@/lib/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NumberInput = (props) => {
  const inputLogic = useInput({
    ...props,
    properties: {
      ...props.properties,
      value: Number(parseFloat(props.properties.value).toFixed(props.properties.decimalPlaces)),
    },
  });

  const handleChange = (e) => {
    if (e.target.value === '') {
      inputLogic.setInputValue(null);
      props.fireEvent('onChange');
    } else {
      const newValue = Number(parseFloat(e.target.value));
      inputLogic.setInputValue(newValue);
      if (!isNaN(newValue)) {
        props.fireEvent('onChange');
      }
    }
  };

  const handleBlur = (e) => {
    const value = Number(parseFloat(e.target.value).toFixed(props.properties.decimalPlaces));
    inputLogic.setInputValue(value);
    inputLogic.handleBlur(e);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    const newValue = (inputLogic.value || 0) + 1;
    inputLogic.setInputValue(newValue);
    if (!isNaN(newValue)) {
      props.fireEvent('onChange');
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (inputLogic.value || 0) - 1;
    inputLogic.setInputValue(newValue);
    if (!isNaN(newValue)) {
      props.fireEvent('onChange');
    }
  };

  const numberControls = !inputLogic.isResizing && (
    <div className="tw-w-5 tw-z-[2] tw-shrink-0 tw-self-stretch tw-flex tw-flex-col tw-border-0 tw-border-l tw-border-solid tw-border-[var(--cc-default-border)]">
      <div
        onClick={handleIncrement}
        className="tw-grid tw-place-items-center tw-cursor-pointer tw-border-0 tw-border-b tw-border-solid tw-border-[var(--cc-default-border)] tw-flex-1 number-input-arrow"
      >
        <SolidIcon width="16" fill={'var(--icons-default)'} name="TriangleDownCenter" />
      </div>

      <div
        onClick={handleDecrement}
        className="tw-grid tw-place-items-center tw-cursor-pointer tw-flex-1 number-input-arrow"
      >
        <SolidIcon fill={'var(--icons-default)'} width="16" name="TriangleUpCenter" />
      </div>
    </div>
  );

  useEffect(() => {
    if (isNaN(inputLogic.value) || inputLogic.value === '') {
      props.setExposedVariable('value', null);
    }
  }, [inputLogic.value]);

  return (
    <BaseInput
      {...props}
      {...inputLogic}
      inputType="number"
      handleChange={handleChange}
      handleBlur={handleBlur}
      additionalInputProps={{
        min: props.validation?.minValue ?? null,
        max: props.validation?.maxValue ?? null,
      }}
      rightIcon={numberControls}
      classes={{
        inputContainer: cn({ 'tw-pr-0 tw-py-0': !inputLogic.loading }),
      }}
    />
  );
};
