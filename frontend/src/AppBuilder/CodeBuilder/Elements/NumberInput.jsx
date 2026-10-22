import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useThemeDefault } from '@/AppBuilder/CodeEditor/themeDefault';

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
  // A blank UI 2.0 style (a card radius) follows the theme: its placeholder is the theme's value (themeDefault.js).
  const themeDefault = useThemeDefault();
  const themeNumber = themeDefault ? parseFloat(themeDefault.value) : NaN;
  // A size the theme leaves to the content (a menu's width) says Auto.
  const placeholder = themeDefault
    ? Number.isFinite(themeNumber)
      ? String(themeNumber)
      : themeDefault.value === 'auto'
      ? 'Auto'
      : 'Theme'
    : '';
  const prefixIcon = meta?.prefixIcon;

  const getStepValue = () => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const handleStepChange = (direction) => {
    onChange(getStepValue() + direction * step);
  };

  return (
    <div className="form-text tj-number-input-element">
      {prefixIcon && (
        <SolidIcon
          name={prefixIcon}
          width="16"
          fill="var(--icons-default)"
          style={{ position: 'absolute', left: '10px', top: '8px', pointerEvents: 'none' }}
          data-cy={`${inputId}-prefix-icon`}
        />
      )}
      <input
        style={{
          width: '142px',
          height: '32px',
          caretColor: allowTyping ? undefined : 'transparent',
          cursor: allowTyping ? undefined : 'default',
          paddingLeft: prefixIcon ? '30px' : undefined,
        }}
        data-cy={inputId}
        type="number"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder={placeholder}
        title={themeDefault ? 'Follows the app theme. Enter a value to set your own.' : undefined}
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
