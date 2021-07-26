import React from 'react';

export const RadioButton = ({options, onChange, cellIndex,  columntypeValues, componentState}) => {
  let checkboxValue = "";
  if(Object.keys(componentState.changeSet || {}).length > 0 ) {
    columntypeValues.map(val => {
      if(val.columnType == 'radiobutton') {
        Object.entries(componentState.changeSet).map((e) => ( { [e[0]]: e[1] } )).map(ele => {
          if(Object.keys(ele) == cellIndex) {
            Object.keys(ele[cellIndex]).map(val2 => {
              if(val.key == val2) {
                checkboxValue = ele[cellIndex][val2]
              }
            })
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
        <label class="form-check form-check-inline " key={option.value}>
          <input class="form-check-input" name={`inlineRadioOptions${cellIndex}`}
          value={option.value}  
          onChange={(e) => addValue(e.target.value)}
          type="radio" 
          checked={checkboxValue == option.value ? "checked" : "" } />
          <span class="form-check-label">{option.name}</span>
        </label>
      )}
    </div>
  );
};
