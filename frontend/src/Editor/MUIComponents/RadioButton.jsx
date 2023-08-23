import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import FormControlLabel from '@mui/material/FormControlLabel';

export const RadioButton = function RadioButton({
  id,
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  registerAction,
  darkMode,
  dataCy,
}) {
  const { label, value, values, display_values } = properties;
  const { visibility, disabledState, activeColor, boxShadow } = styles;
  const textColor = darkMode && styles.textColor === '#000' ? '#fff' : styles.textColor;
  const [checkedValue, setValue] = useState(() => value);
  useEffect(() => setValue(value), [value]);

  let selectOptions = [];

  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { name: display_values[index], value: value };
      }),
    ];
  } catch (err) {
    console.log(err);
  }

  function onSelect(selection) {
    setValue(selection);
    setExposedVariable('value', selection).then(() => fireEvent('onSelectionChange'));
  }

  useEffect(() => {
    setExposedVariable('value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  registerAction(
    'selectOption',
    async function (option) {
      onSelect(option);
    },
    [setValue]
  );

  return (
    <div
      data-disabled={disabledState}
      style={{
        height,
        display: visibility ? 'flex' : 'none',
        boxShadow,
      }}
      data-cy={dataCy}
    >
      <FormLabel style={{ color: textColor, marginRight: '10px', paddingTop: '15px' }}>{label}</FormLabel>
      <RadioGroup
        value={checkedValue}
        name={`${id}-${uuidv4()}`}
        style={{
          marginTop: '1px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {selectOptions.map((option, index) => (
            <FormControlLabel
              key={index}
              onChange={() => onSelect(option.value)}
              style={{
                color: textColor,
                flexBasis: 'auto',
                padding: '5px',
              }}
              value={option.value}
              control={
                <Radio
                  sx={{
                    '&.Mui-checked': {
                      color: checkedValue === option.value ? `${activeColor}` : 'white',
                    },
                  }}
                />
              }
              label={`${option.name}`}
            />
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
