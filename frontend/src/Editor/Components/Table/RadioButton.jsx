import React from 'react';

export const RadioButton = ({options, onChange, cellIndex,  columntypeValues, changeSet}) => {
  let checkboxValue = "";

  if(changeSet[cellIndex]) {
    columntypeValues.map(val => {
      if(val.columnType == 'radiobutton') {
        Object.keys(changeSet[cellIndex]).map(ele => {
          if(val.key == ele) {
            checkboxValue = changeSet[cellIndex][ele]
          }
        })
      }
    })
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
          {checkboxValue == option.value && <div class="checked-circle" ></div>}
          <input className="form-check-input" type="radio" name={`inlineRadioOptions${cellIndex}`}  
          value={option.value} 
          onChange={(e) => addValue(e.target.value)} />
          <label className="form-check-label" >{option.name}</label>
        </div>
      )}
    </div>
  );
};
