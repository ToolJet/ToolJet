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
        <div className="form-check form-check-inline custom-radio" key={option.value}>
          {checkboxValue == option.value && <div class="checked-circle" ></div>}
          <input className="form-check-input" type="radio" name={`inlineRadioOptions${cellIndex}`}  
          value={option.value} 
          onChange={(e) => addValue(e.target.value)}   />
          <label className="form-check-label" >{option.name}</label>
        </div>
      )}
    </div>
  );
};
