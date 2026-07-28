import React, { useEffect, useRef } from 'react';
import { BaseInput } from './BaseComponents/BaseInput';
import { useInput } from './BaseComponents/hooks/useInput';
import { cn } from '@/lib/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NumberInput = (props) => {
  const inputRef = useRef(null);

  const inputLogic = useInput({
    ...props,
    properties: {
      ...props.properties,
      value: Number(parseFloat(props.properties.value).toFixed(props.properties.decimalPlaces)),
    },
  });

  const { showClearBtn, disableStepControls } = props.properties;

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
    inputLogic.setShowValidationError(true);
    if (!isNaN(newValue)) {
      props.fireEvent('onChange');
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    const newValue = (inputLogic.value || 0) - 1;
    inputLogic.setInputValue(newValue);
    inputLogic.setShowValidationError(true);
    if (!isNaN(newValue)) {
      props.fireEvent('onChange');
    }
  };

  const getCustomStyles = (baseStyles) => {
    return {
      ...baseStyles,
      paddingRight: showClearBtn ? '30px' : '0px',
    };
  };

  const handleClear = () => {
    inputLogic.setInputValue('');
    props.fireEvent('onChange');
  };

  const handleKeyDown = (e) => {
    if (disableStepControls && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
    }
  };

  const numberControls = !disableStepControls && !inputLogic.isResizing && (
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
    if (!disableStepControls || !inputRef.current) return;

    const el = inputRef.current;

    // undefined = not yet searched, null = searched but no scrollable ancestor found
    let scrollableParent = undefined;

    const handleWheel = (e) => {
      // Prevent the browser from changing the input value on scroll
      e.preventDefault();

      // Lazy-init: walk the DOM only on the first scroll, then cache the result.
      // This avoids doing any work if the user never scrolls over the input.
      if (scrollableParent === undefined) {
        scrollableParent = null;

        let parent = el.parentElement;

        while (parent) {
          // String concat lets one regex check both overflow and overflowY at once.
          // e.g. overflow="visible", overflowY="auto" → "visibleauto" → matches "auto"
          const { overflow, overflowY } = window.getComputedStyle(parent);

          const isScrollable = /(auto|scroll)/.test(overflow + overflowY) && parent.scrollHeight > parent.clientHeight;

          if (isScrollable) {
            scrollableParent = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }

      (scrollableParent ?? window).scrollBy(0, e.deltaY);
    };

    // { passive: false } is required — without it the browser silently ignores preventDefault()
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => el.removeEventListener('wheel', handleWheel);
  }, [disableStepControls]);

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
      inputRef={inputRef}
      additionalInputProps={{
        min: props.validation?.minValue ?? null,
        max: props.validation?.maxValue ?? null,
        onKeyDown: handleKeyDown,
      }}
      rightIcon={numberControls}
      classes={{
        inputContainer: cn({ 'tw-pr-0 tw-py-0': !inputLogic.loading }),
      }}
      showClearBtn={showClearBtn}
      onClear={handleClear}
      clearButtonRightOffset={20}
      getCustomStyles={getCustomStyles}
    />
  );
};
