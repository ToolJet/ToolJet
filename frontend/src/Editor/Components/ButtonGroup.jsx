import React, { useEffect, useState } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';
import _ from 'lodash';
import config from 'config';
import MUIButton from '@mui/material/Button';
import MUIButtonGroup from '@mui/material/ButtonGroup';

export const ButtonGroup = function Button({
  height,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  darkMode,
  dataCy,
}) {
  const { label, multiSelection } = properties;
  const values = isExpectedDataType(properties.values, 'array');
  const labels = isExpectedDataType(properties.labels, 'array');
  const defaultSelected = isExpectedDataType(properties.defaultSelected, 'array');

  const {
    backgroundColor,
    textColor,
    borderRadius,
    visibility,
    disabledState,
    selectedBackgroundColor,
    selectedTextColor,
    boxShadow,
  } = styles;

  const computedStyles = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    display: visibility ? '' : 'none',
  };

  const [defaultActive, setDefaultActive] = useState(defaultSelected);
  const [data, setData] = useState(values);

  useEffect(() => {
    setDefaultActive(defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultSelected)]);

  useEffect(() => {
    let dataset = values;
    if (labels?.length < values?.length) {
      labels.map((item, index) => {
        dataset[index] = item;
      });
      setData(dataset);
    } else {
      setData(labels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ labels, values })]);

  useEffect(() => {
    setDefaultActive(defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiSelection]);

  const buttonClick = (index) => {
    if (defaultActive?.includes(values[index]) && multiSelection) {
      const copyDefaultActive = defaultActive;
      copyDefaultActive?.splice(copyDefaultActive?.indexOf(values[index]), 1);
      setDefaultActive(copyDefaultActive);
      setExposedVariable('selected', copyDefaultActive.join(',')).then(() => fireEvent('onClick'));
    } else if (multiSelection) {
      setExposedVariable('selected', [...defaultActive, values[index]].join(',')).then(() => fireEvent('onClick'));
      setDefaultActive([...defaultActive, values[index]]);
    } else if (!multiSelection) {
      setExposedVariable('selected', [values[index]]).then(() => fireEvent('onClick'));
      setDefaultActive([values[index]]);
    }
    if (values?.length == 0) {
      setExposedVariable('selected', []).then(() => fireEvent('onClick'));
    }
  };
  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <div
          className="widget-buttongroup"
          style={{ height }}
          data-cy={dataCy}
        >
          {label && (
            <p
              style={{ display: computedStyles.display }}
              className={`widget-buttongroup-label ${darkMode && 'text-light'}`}
            >
              {label}
            </p>
          )}
          <div>
            {data?.map((item, index) => (
              <button
                style={{
                  ...computedStyles,
                  backgroundColor: defaultActive?.includes(values[index]) ? selectedBackgroundColor : backgroundColor,
                  color: defaultActive?.includes(values[index]) ? selectedTextColor : textColor,
                  transition: 'all .1s ease',
                  boxShadow,
                }}
                key={index}
                disabled={disabledState}
                className={'group-button overflow-hidden'}
                onClick={(event) => {
                  event.stopPropagation();
                  buttonClick(index);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      {config.UI_LIB === 'mui' && (
        <div
          className="widget-buttongroup"
          style={{ height }}
          data-cy={dataCy}
        >
          {label && (
            <p
              style={{ display: computedStyles.display }}
              className={`widget-buttongroup-label ${darkMode && 'text-light'}`}
            >
              {label}
            </p>
          )}
          <MUIButtonGroup
            variant="outlined"
            aria-label="outlined primary button group"
          >
            {data?.map((item, index) => (
              <MUIButton
                style={{
                  ...computedStyles,
                  backgroundColor: defaultActive?.includes(values[index]) ? selectedBackgroundColor : backgroundColor,
                  color: defaultActive?.includes(values[index]) ? selectedTextColor : textColor,
                  transition: 'all .1s ease',
                  boxShadow,
                }}
                key={index}
                disabled={disabledState}
                className={'group-button overflow-hidden'}
                onClick={(event) => {
                  event.stopPropagation();
                  buttonClick(index);
                }}
              >
                {item}
              </MUIButton>
            ))}
          </MUIButtonGroup>
        </div>
      )}
    </>
  );
};
