import React from 'react';

export const RadioButton = ({options, onChange, cellIndex,  changeSet}) => {
  let checkboxValue = "";

  if(changeSet[cellIndex]) {
    checkboxValue = changeSet[cellIndex][Object.keys(changeSet[cellIndex])][0];
  }

  function addValue(value) {
    setTimeout(() => {
        onChange(value);
    }, 200);
  }

  return (
    <div>
      {options.map((option, i) => 
        <div className="form-check form-check-inline custom-radio" key={option.value}>
          { checkboxValue == option.value && <div class="checked-circle" ></div> }
          <input className="form-check-input" type="radio" name={`inlineRadioOptions${cellIndex}`}  
          value={option.value} 
          onChange={(e) => addValue(e.target.value)} />
          <label className="form-check-label" >{option.name}</label>
        </div>
      )}
    </div>
  );
};
