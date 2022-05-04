import React, { useEffect, useState } from 'react';
import cx from 'classnames';

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
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? '' : 'none',
    overflow: 'hidden',
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

  const buttonClick = (value) => {};
  return (
    <div className="widget-buttongroup">
      <p className="widget-buttongroup-label">{label}</p>
      <div>
        {data.map((item) => (
          <button
            style={{
              ...computedStyles,
              backgroundColor: defaultActive.includes(item) && selectedBackgroundColor,
              color: defaultActive.includes(item) && selectedTextColor,
            }}
            key={item}
            disabled={disabledState}
            className={cx('group-button  p-1 overflow-hidden', {})}
            onClick={(event) => {
              event.stopPropagation();
              fireEvent('onClick');
              multiSelection ? setDefaultActive([...defaultActive, item]) : setDefaultActive([item]);
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
