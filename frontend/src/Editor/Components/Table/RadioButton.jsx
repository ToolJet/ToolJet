import React from 'react';

export const RadioButton = ({options, onChange, cellIndex}) => {

  function addValue(radioButtonValue) {
    onChange(radioButtonValue);
  }
  
  return (
    <div>
      {options.map((option) => 
        <div className="form-check form-check-inline" key={option.value}>
          <input className="form-check-input" type="radio" name={`inlineRadioOptions${cellIndex}`}  
          value={option.value} 
          onChange={(e) => addValue(e.target.value)} />
          <label className="form-check-label" >{option.name}</label>
        </div>
      )}
    </div>
  );
};
