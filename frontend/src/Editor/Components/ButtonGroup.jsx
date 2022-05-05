import React, { useEffect, useState } from 'react';

export const ButtonGroup = function Button({ height, properties, styles, fireEvent }) {
  const { values, labels, label, defaultValue, multiSelection } = properties;
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

  const [defaultActive, setDefaultActive] = useState([defaultValue]);
  const [data, setData] = useState(labels.length > 0 ? labels : values);

  useEffect(() => {
    setDefaultActive(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setData(labels.length > 0 ? labels : values.length > 0 ? values : []);
  }, [labels, values]);

  useEffect(() => {
    setDefaultActive([]);
  }, [multiSelection]);

  const buttonClick = (value) => {
    if (defaultActive.includes(value)) {
      defaultActive.splice(defaultActive.indexOf(value), 1);
    } else multiSelection ? setDefaultActive([...defaultActive, value]) : setDefaultActive([value]);
  };
  return (
    <div className="widget-buttongroup" style={{ height }}>
      <p className="widget-buttongroup-label">{label}</p>
      <div>
        {data.map((item) => (
          <button
            style={{
              ...computedStyles,
              backgroundColor: defaultActive.includes(item) ? selectedBackgroundColor : backgroundColor,
              color: defaultActive.includes(item) ? selectedTextColor : textColor,
            }}
            key={item}
            disabled={disabledState}
            className={'group-button  p-1 overflow-hidden'}
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
