import React from 'react';

export const CustomToggleSwitch = ({ isChecked, toggleSwitchFunction, action, darkMode = false, label = '' }) => {
  return (
    <div className={`custom-toggle-switch d-flex col gap-2 align-items-center ${darkMode && 'theme-dark'}`}>
      <label className="switch">
        <input
          type="checkbox"
          id={action}
          checked={isChecked}
          onClick={() => {
            toggleSwitchFunction(action);
          }}
        />
        <label htmlFor={action} className="slider round"></label>
      </label>
      {label && <span>{label}</span>}
    </div>
  );
};
