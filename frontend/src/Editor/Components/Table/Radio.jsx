import React, { useState } from 'react';

export const Radio = ({ options, value, onChange, readOnly }) => {

  value = value === undefined ? [] : value;

  return (
    <div className="radio row">
      <div>
        {options.map((option) => 
          <label class="form-check form-check-inline" onClick={() => { if(!readOnly) onChange(option.value); } }>
            <input class="form-check-input" type="radio" checked={option.value === value} disabled={readOnly && (option.value !== value)}/>
            <span class ="form-check-label">{option.name}</span>
          </label>
        )}
      </div>
    </div>
  );
};