import React from 'react';

export const CustomToggleSwitch = ({
  isChecked,
  toggleSwitchFunction,
  action,
  darkMode = false,
  label = '',
  dataCy = '',
}) => {
  return (
    <div className={`custom-toggle-switch d-flex col gap-2 align-items-center ${darkMode && 'theme-dark'}`}>
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
        />
        <label htmlFor={action} className="slider round"></label>
      </label>
      {label && (
        <span className={`${darkMode ? 'color-white' : 'color-light-slate-12'}`} data-cy={`${dataCy}-toggle-label`}>
          {label}
        </span>
      )}
    </div>
  );
};
