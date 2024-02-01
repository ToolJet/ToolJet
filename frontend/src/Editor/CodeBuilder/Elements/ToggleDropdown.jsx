import React, { useState } from 'react';

export const ToggleDropdown = ({ value, onChange, cyLabel }) => {
  const [selectedOption, setSelectedOption] = useState('');

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div className="row fx-container toggle-dropdown-container">
      <div className="col d-flex align-items-center ">
        <div className="field">
          <label
            className="form-check form-switch mb-0 d-flex justify-content-end"
            style={{ marginBottom: '0px', paddingLeft: '28px' }}
          >
            <input
              className="form-check-input"
              type="checkbox"
              onClick={() => onChange(`{{${!value}}}`)}
              checked={value}
              data-cy={`${cyLabel}-toggle-button`}
            />
          </label>
        </div>
      </div>
      {value && (
        <div>
          <div>
            <label htmlFor="dropdown">Date format</label>
            <select id="dropdown" value={selectedOption} className="select-dropdown" onChange={handleSelectChange}>
              <option value="">Select...</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
          </div>
          <p>Selected option: {selectedOption}</p>
        </div>
      )}
    </div>
  );
};
