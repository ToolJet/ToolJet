import React, { useEffect, useState } from 'react';
import cx from 'classnames';

export const ButtonGroup = function Button({ height, properties, styles, fireEvent }) {
  const { loadingState, values, labels, label, defaultValue } = properties;
  const { backgroundColor, textColor, borderRadius, visibility, disabledState } = styles;

  const computedStyles = {
    backgroundColor,
    color: textColor,
    width: '100%',
    borderRadius: `${borderRadius}px`,
    height,
    display: visibility ? '' : 'none',
  };

  const [defaultActive, setDefaultActive] = useState(defaultValue);
  const [data, setData] = useState(labels.length > 0 ? labels : values);

  useEffect(() => {
    setDefaultActive(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setData(labels.length > 0 ? labels : values.length > 0 ? values : []);
  }, [labels, values]);

  useEffect(() => {
    console.log('check', defaultActive);
  }, [defaultActive]);

  return (
    <div className="widget-buttongroup">
      <p className="widget-buttongroup-label">{label}</p>
      <div>
        {data.map((item) => (
          <button
            key={item}
            disabled={disabledState}
            className={cx('group-button btn btn-primary p-1 overflow-hidden', {
              'btn-loading': loadingState,
              'buttongrpup-active': item == defaultActive,
            })}
            // style={computedStyles}
            onClick={(event) => {
              event.stopPropagation();
              fireEvent('onClick');
              setDefaultActive(item);
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
