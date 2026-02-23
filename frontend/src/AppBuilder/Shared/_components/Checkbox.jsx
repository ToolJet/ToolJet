import React from 'react';

/**
 * Shared Checkbox component — the pure visual checkbox control.
 * Used by the Checkbox widget and TreeSelect widget.
 *
 * When `onChange` is provided, the component is interactive (clickable).
 * When `onChange` is omitted, it renders as a pure visual icon with
 * pointer-events disabled — safe to use inside react-checkbox-tree icons.
 *
 * @param {boolean}  checked           - Whether the checkbox is checked
 * @param {function} [onChange]        - Callback when toggled (omit for icon-only mode)
 * @param {boolean}  [disabled=false]  - Whether the checkbox is disabled
 * @param {string}   [checkboxColor]   - Background color when checked
 * @param {string}   [uncheckedColor]  - Background color when unchecked
 * @param {string}   [borderColor]     - Border color
 * @param {string}   [handleColor]     - Checkmark stroke color
 * @param {number}   [size=18]         - Checkbox size in px
 */
const Checkbox = ({
  checked = false,
  isHalfCheck = false,
  onChange,
  disabled = false,
  checkboxColor = 'var(--primary)',
  uncheckedColor = 'transparent',
  borderColor = '#CCD1D5',
  handleColor = '#fff',
  size = 18,
  className = '',
  style = {},
  ...rest
}) => {
  const iconSize = size - 4; // checkmark inset
  const isInteractive = typeof onChange === 'function';

  const resolvedBorderColor =
    borderColor === '#CCD1D5' ? (checked || isHalfCheck ? 'transparent' : 'var(--borders-default)') : borderColor;

  const checkboxStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : isInteractive ? 'pointer' : 'default',
    border: `1px solid ${resolvedBorderColor}`,
    backgroundColor: checked || isHalfCheck ? checkboxColor : uncheckedColor,
    borderRadius: '5px',
    height: `${size}px`,
    width: `${size}px`,
    minHeight: `${size}px`,
    minWidth: `${size}px`,
    position: 'relative',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    // When used as a pure icon (no onChange), disable pointer events
    // so parent elements (e.g. react-checkbox-tree labels) handle clicks
    pointerEvents: isInteractive ? 'auto' : 'none',
    ...style,
  };

  const checkmarkStyle = {
    visibility: checked || isHalfCheck ? 'visible' : 'hidden',
    height: `${iconSize}px`,
    width: `${iconSize}px`,
    display: 'flex',
    position: 'absolute',
    top: '1px',
    right: '1px',
  };

  const handleClick = isInteractive
    ? (e) => {
        e.stopPropagation();
        if (disabled) return;
        onChange(!checked);
      }
    : undefined;

  return (
    <div
      className={`shared-checkbox ${className}`}
      style={checkboxStyle}
      onClick={handleClick}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      {...rest}
    >
      <div style={checkmarkStyle}>
        {checked && !isHalfCheck && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon-tabler icon-tabler-check"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke={handleColor}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12l5 5l10 -10" />
          </svg>
        )}
        {isHalfCheck && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon-tabler icon-tabler-minus"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke={handleColor}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12h14" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default Checkbox;
