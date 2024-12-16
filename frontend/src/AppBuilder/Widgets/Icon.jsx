import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons-react';
import cx from 'classnames';

export const Icon = ({ properties, styles, fireEvent, width, height, setExposedVariables, darkMode, dataCy }) => {
  const { icon } = properties;
  const { iconColor, visibility, boxShadow } = styles;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[icon];

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
    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cx('icon-widget', { 'd-none': !showIcon }, { 'cursor-pointer': false })} data-cy={dataCy}>
      <IconElement
        color={color}
        style={{ width, height, boxShadow, color: iconColor }}
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
