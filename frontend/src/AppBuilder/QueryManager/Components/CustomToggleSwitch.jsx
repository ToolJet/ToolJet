import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

export const CustomToggleSwitch = ({
  isChecked,
  toggleSwitchFunction,
  action,
  darkMode = false,
  label = '',
  dataCy = '',
  disabled = false,
  subLabel = '',
}) => {
  const switchToggle = (
    <label className="switch">
      <input
        type="checkbox"
        id={action}
        checked={isChecked}
        onClick={() => {
          if (action === 'bodyToggle') {
            toggleSwitchFunction(!isChecked);
          } else {
            toggleSwitchFunction(action);
          }
        }}
        data-cy={`${dataCy}-toggle-switch`}
        disabled={disabled}
      />
      <label htmlFor={action} className="slider round"></label>
    </label>
  );

  return (
    <div
      data-tooltip-id={dataCy === 'copilot' ? 'tooltip-for-active-copilot' : ''}
      data-tooltip-content="Only workspace admins can enable or disable Copilot."
      className={`custom-toggle-switch d-flex col gap-2 align-items-top`}
    >
      {switchToggle}
      <div className="d-flex flex-column">
        {label && (
          <span className={`${darkMode ? 'color-white' : 'color-light-slate-12'}`} data-cy={`${dataCy}-toggle-label`}>
            {label}
          </span>
        )}
        {subLabel && (
          <span style={{ color: '#687076' }} data-cy={`${dataCy}-toggle-sublabel`}>
            {subLabel}
          </span>
        )}
      </div>
      {disabled && dataCy === 'copilot' && (
        <ReactTooltip
          id="tooltip-for-active-copilot"
          className="tooltip"
          style={{ backgroundColor: '#e6eefe', color: '#222' }}
        />
      )}
    </div>
  );
};
