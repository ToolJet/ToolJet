import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const NumberInput = ({
  value,
  onChange,
  cyLabel,
  meta,
  step = 1,
  allowTyping = true,
  showNativeStepper = false,
}) => {
  const inputId = `${String(cyLabel)}-input`;

  const getStepValue = () => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const handleStepChange = (direction) => {
    onChange(getStepValue() + direction * step);
  };

  return (
    <div className="form-text tj-number-input-element">
      <input
        style={{
          width: '142px',
          height: '32px',
          caretColor: allowTyping ? undefined : 'transparent',
          cursor: allowTyping ? undefined : 'default',
        }}
        data-cy={inputId}
        type="number"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder=""
        id={inputId}
        step={step}
        readOnly={!allowTyping}
        tabIndex={allowTyping ? undefined : -1}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onMouseDown={(e) => {
          if (!allowTyping) {
            e.preventDefault();
          }
        }}
        onFocus={(e) => {
          if (!allowTyping) {
            e.target.blur();
          }
        }}
        onKeyDown={(e) => {
          if (!allowTyping && e.key !== 'Tab') {
            e.preventDefault();
          }
        }}
        onPaste={(e) => {
          if (!allowTyping) {
            e.preventDefault();
          }
        }}
        autoComplete="off"
      />
      {showNativeStepper && (
        <div
          className="tw-w-5 tw-shrink-0 tw-self-stretch tw-flex tw-flex-col tw-border-0 tw-border-l tw-border-solid tw-border-[var(--cc-default-border)]"
          style={{ position: 'absolute', right: '0px', top: '0px' }}
        >
          <div
            role="button"
            tabIndex={-1}
            aria-label={`Increase ${String(cyLabel)}`}
            data-cy={`${inputId}-increment`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepChange(1)}
            className="tw-grid tw-place-items-center tw-cursor-pointer tw-border-0 tw-border-b tw-border-solid tw-border-[var(--cc-default-border)] tw-flex-1 number-input-arrow"
          >
            <SolidIcon width="16" fill="var(--icons-default)" name="TriangleDownCenter" />
          </div>
          <div
            role="button"
            tabIndex={-1}
            aria-label={`Decrease ${String(cyLabel)}`}
            data-cy={`${inputId}-decrement`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepChange(-1)}
            className="tw-grid tw-place-items-center tw-cursor-pointer tw-flex-1 number-input-arrow"
          >
            <SolidIcon width="16" fill="var(--icons-default)" name="TriangleUpCenter" />
          </div>
        </div>
      )}
      <label
        htmlFor={inputId}
        className="static-value tj-text-xsm"
        style={{ right: showNativeStepper ? '26px' : undefined }}
      >
        {meta.staticText?.length > 0 ? meta.staticText : meta.staticText?.length == 0 ? '' : 'px'}
      </label>
    </div>
  );
};
