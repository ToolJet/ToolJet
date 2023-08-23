import _ from 'lodash';
import React, { useState, useEffect } from 'react';
import { Autocomplete, Box, Checkbox, FormControlLabel, TextField } from '@mui/material';

export const Multiselect = function Multiselect({
  id,
  component,
  height,
  properties,
  styles,
  exposedVariables,
  setExposedVariable,
  onComponentClick,
  darkMode,
  fireEvent,
  registerAction,
  dataCy,
}) {
  const { label, value, values, display_values, showAllOption } = properties;
  const { borderRadius, visibility, disabledState, boxShadow } = styles;
  const [selected, setSelected] = useState([]);

  const [checked, setChecked] = useState(false);
  React.useEffect(() => {
    if (selected.length === selectOptions.length) {
      setChecked(true);
    } else {
      setChecked(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const onClickAll = () => {
    if (selected.length !== 0 && selected.length !== selectOptions.length) {
      setSelected([...selectOptions]);
    } else if (selected.length === 0) {
      setSelected([...selectOptions]);
    } else {
      setSelected([]);
    }
  };

  let selectOptions = [];
  try {
    selectOptions = [
      ...values.map((value, index) => {
        return { label: display_values[index], value: value };
      }),
    ];
  } catch (err) {
    console.log(err);
  }

  useEffect(() => {
    let newValues = [];

    if (_.intersection(values, value)?.length === value?.length) newValues = value;

    setExposedVariable('values', newValues);
    setSelected(selectOptions.filter((option) => newValues.includes(option.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), JSON.stringify(display_values)]);

  useEffect(() => {
    setExposedVariable('values', value);
    setSelected(selectOptions.filter((option) => value.includes(option.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), JSON.stringify(display_values)]);

  useEffect(() => {
    if (value && !selected) {
      setSelected(selectOptions.filter((option) => properties.value.includes(option.value)));
    }

    if (JSON.stringify(exposedVariables.values) === '{}') {
      setSelected(selectOptions.filter((option) => properties.value.includes(option.value)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  registerAction(
    'selectOption',
    async function (value) {
      if (
        selectOptions.some((option) => option.value === value) &&
        !selected.some((option) => option.value === value)
      ) {
        const newSelected = [
          ...selected,
          ...selectOptions.filter(
            (option) =>
              option.value === value && !selected.map((selectedOption) => selectedOption.value).includes(value)
          ),
        ];
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        ).then(() => fireEvent('onSelect'));
      }
    },
    [selected, setSelected]
  );
  registerAction(
    'deselectOption',
    async function (value) {
      if (selectOptions.some((option) => option.value === value) && selected.some((option) => option.value === value)) {
        const newSelected = [
          ...selected.filter(function (item) {
            return item.value !== value;
          }),
        ];
        setSelected(newSelected);
        setExposedVariable(
          'values',
          newSelected.map((item) => item.value)
        ).then(() => fireEvent('onSelect'));
      }
    },
    [selected, setSelected]
  );
  registerAction(
    'clearSelections',
    async function () {
      if (selected.length >= 1) {
        setSelected([]);
        setExposedVariable('values', []).then(() => fireEvent('onSelect'));
      }
    },
    [selected, setSelected]
  );

  return (
    <Autocomplete
      id={id}
      multiple
      fullWidth
      size="small"
      value={selected}
      options={[{ label: 'Select All', value: 'Select All', isShow: showAllOption }, ...selectOptions]}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      disabled={disabledState}
      disableCloseOnSelect
      renderOption={(props, option, state, ownerState) => {
        if (option.label === 'Select All') {
          return (
            <>
              {showAllOption ? (
                <Box
                  {...props}
                  onClick={onClickAll}
                  sx={{
                    borderRadius: '8px',
                    margin: '5px',
                    padding: '8px',
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox checked={checked} />}
                    label={option.label}
                    component="li"
                  />
                </Box>
              ) : (
                <></>
              )}
            </>
          );
        } else {
          return (
            <Box
              {...props}
              sx={{
                borderRadius: '8px',
                margin: '5px',
                padding: '8px',
              }}
            >
              <FormControlLabel
                control={<Checkbox checked={props['aria-selected']} />}
                label={ownerState.getOptionLabel(option)}
                component="li"
              />
            </Box>
          );
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          sx={{ display: visibility ? '' : 'none' }}
        />
      )}
      onChange={(event, newValue) => {
        setSelected(newValue);
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: '36px',
          height,
          borderRadius: `${styles.borderRadius}px`,
          color: styles.textColor,
          backgroundColor: darkMode && ['#fff'].includes(styles.backgroundColor) ? '#232e3c' : styles.backgroundColor,
          boxShadow: styles.boxShadow,
        },
      }}
    />
  );
};
