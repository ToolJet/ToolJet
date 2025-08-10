import React, { useEffect, useState } from 'react';
import { isExpectedDataType } from '@/_helpers/utils';
import _ from 'lodash';

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
    alignment,
  } = styles;

  const computedStyles = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    display: visibility ? '' : 'none',
  };

  const disabledStyles = {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  };

  const [defaultActive, setDefaultActive] = useState(defaultSelected);
  const [data, setData] = useState(values);

  useEffect(() => {
    setDefaultActive(defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultSelected)]);

  useEffect(() => {
    let dataset = [...values]; // Make a copy to avoid mutating a read-only array
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

  const setSelected = (selected) => {
    if (multiSelection) {
      if (Array.isArray(selected)) {
        const filteredItems = selected.filter((item) => values.includes(item));
        setDefaultActive(filteredItems);
        setExposedVariable('selected', filteredItems.join(','));
      } else if ((typeof selected === 'string' || typeof selected === 'number') && values.includes(selected)) {
        setDefaultActive([selected]);
        setExposedVariable('selected', String(selected));
      }
    } else {
      if (Array.isArray(selected)) {
        const filteredItems = selected.filter((item) => values.includes(item));
        if (filteredItems?.length >= 1) {
          setDefaultActive([filteredItems[0]]);
          setExposedVariable('selected', String(filteredItems[0]));
        }
      } else if ((typeof selected === 'string' || typeof selected === 'number') && values.includes(selected)) {
        setDefaultActive([selected]);
        setExposedVariable('selected', String(selected));
      }
    }
  };

  useEffect(() => {
    setExposedVariable('setSelected', setSelected);
  }, [multiSelection, values]);

  const buttonClick = (index) => {
    if (defaultActive?.includes(values[index]) && multiSelection) {
      const copyDefaultActive = [...defaultActive];
      copyDefaultActive?.splice(copyDefaultActive?.indexOf(values[index]), 1);
      setDefaultActive(copyDefaultActive);
      setExposedVariable('selected', copyDefaultActive.join(','));
      fireEvent('onClick');
    } else if (multiSelection) {
      setExposedVariable('selected', [...defaultActive, values[index]].join(','));
      fireEvent('onClick');
      setDefaultActive([...defaultActive, values[index]]);
    } else if (!multiSelection) {
      setExposedVariable('selected', [values[index]]);
      fireEvent('onClick');
      setDefaultActive([values[index]]);
    }
    if (values?.length == 0) {
      setExposedVariable('selected', []);
      fireEvent('onClick');
    }
  };

  const mapAlignment = (alignment) => {
    switch (alignment) {
      case 'left':
        return 'flex-start';
      case 'right':
        return 'flex-end';
      case 'center':
        return 'center';
      default:
        return 'flex-start'; // Default to left alignment if the value is unknown
    }
  };
  return (
    <div className="widget-buttongroup" style={{ height, alignItems: mapAlignment(alignment) }} data-cy={dataCy}>
      <div>
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
                ...(disabledState && disabledStyles),
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
    </div>
  );
};
