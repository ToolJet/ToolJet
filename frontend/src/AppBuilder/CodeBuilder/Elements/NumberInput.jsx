import React from 'react';
import { Triangle } from 'lucide-react';

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
          style={{
            position: 'absolute',
            right: '28px',
            top: '3px',
            display: 'flex',
            flexDirection: 'column',
            width: '14px',
            height: '26px',
          }}
        >
          <button
            type="button"
            aria-label={`Increase ${String(cyLabel)}`}
            data-cy={`${inputId}-increment`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepChange(1)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              height: '13px',
              lineHeight: 1,
              fontSize: '8px',
              color: 'var(--slate11)',
            }}
          >
            <Triangle size={8} fill="var(--slate11)" color="var(--slate11)" style={{ transform: 'rotate(0deg)' }} />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${String(cyLabel)}`}
            data-cy={`${inputId}-decrement`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepChange(-1)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              height: '13px',
              lineHeight: 1,
              fontSize: '8px',
              color: 'var(--slate11)',
            }}
          >
            <Triangle size={8} fill="var(--slate11)" color="var(--slate11)" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      )}
      <label htmlFor={inputId} className="static-value tj-text-xsm">
        {meta.staticText?.length > 0 ? meta.staticText : meta.staticText?.length == 0 ? '' : 'px'}
      </label>
    </div>
  );
};
