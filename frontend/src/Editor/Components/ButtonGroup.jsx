import React, { useEffect, useState } from 'react';

export const ButtonGroup = function Button({ height, properties, styles, fireEvent, setExposedVariable }) {
  const { values, labels, label, defaultSelected, multiSelection } = properties;
  const {
    backgroundColor,
    textColor,
    borderRadius,
    visibility,
    disabledState,
    selectedBackgroundColor,
    selectedTextColor,
  } = styles;

  const computedStyles = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    display: visibility ? '' : 'none',
  };

  const [defaultActive, setDefaultActive] = useState(defaultSelected);
  const [data, setData] = useState(
    values?.length <= labels?.length ? [...labels, ...values?.slice(labels?.length)] : labels
  );

  useEffect(() => {
    setDefaultActive(defaultSelected);
  }, [defaultSelected]);

  useEffect(() => {
    setData(labels?.length >= values?.length ? [...labels, ...values?.slice(labels?.length)] : labels);
  }, [labels, values]);

  useEffect(() => {
    console.log('data', data);
  }, [data]);

  useEffect(() => {
    multiSelection && setDefaultActive([]);
  }, [multiSelection]);

  useEffect(() => {
    setExposedVariable('selected', defaultActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultActive]);

  const buttonClick = (value) => {
    if (defaultActive?.includes(value)) {
      defaultActive?.splice(defaultActive?.indexOf(value), 1);
    } else multiSelection ? setDefaultActive([...defaultActive, value]) : setDefaultActive([value]);
  };
  return (
    <div className="widget-buttongroup" style={{ height }}>
      <p className="widget-buttongroup-label">{label}</p>
      <div>
        {data?.map((item) => (
          <button
            style={{
              ...computedStyles,
              backgroundColor: defaultActive?.includes(item) ? selectedBackgroundColor : backgroundColor,
              color: defaultActive?.includes(item) ? selectedTextColor : textColor,
              transition: 'all .3s ease',
            }}
            key={item}
            disabled={disabledState}
            className={'group-button overflow-hidden'}
            onClick={(event) => {
              event.stopPropagation();
              fireEvent('onClick');
              buttonClick(item);
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
