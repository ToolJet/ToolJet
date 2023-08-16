import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons-react';
import cx from 'classnames';

export const Icon = ({
  properties,
  styles,
  fireEvent,
  width,
  height,
  setExposedVariable,
  darkMode,
  dataCy,
  component,
}) => {
  const { icon } = properties;
  const { iconColor, visibility, boxShadow } = styles;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon];
  const { definition } = component;
  const { events = [] } = definition;

  const color = iconColor === '#000' ? (darkMode ? '#fff' : '#000') : iconColor;

  const [showIcon, setIconVisibility] = useState(true);

  useEffect(() => {
    showIcon !== visibility && setIconVisibility(visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    const exposedVariables = {
      setVisibility: async function (visibility) {
        setIconVisibility(visibility);
      },
      click: async function () {
        fireEvent('onClick');
      },
    };

    setExposedVariable('allVariables', exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIconVisibility]);

  return (
    <div
      className={cx('icon-widget', { 'd-none': !showIcon }, { 'cursor-pointer': events.length > 0 })}
      data-cy={dataCy}
    >
      <IconElement
        color={color}
        style={{ width, height, boxShadow }}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={(event) => {
          event.stopPropagation();
          fireEvent('onHover');
        }}
        stroke={1.5}
      />
    </div>
  );
};
