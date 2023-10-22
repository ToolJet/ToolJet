import React, { useState, useEffect } from 'react';
import * as Icons from '@tabler/icons-react';
import cx from 'classnames';
import { OverlayTrigger, Tooltip } from 'react-bootstrap'; // Import OverlayTrigger and Tooltip

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
  tooltipMessage, // Add tooltipMessage prop
}) => {
  const { icon } = properties;
  const { iconColor, visibility, boxShadow } = styles;
  const IconElement = Icons[icon];
  const { definition } = component;
  const { events = [] } = definition;

  const color = iconColor === '#000' ? (darkMode ? '#fff' : '#000') : iconColor;

  const [showIcon, setIconVisibility] = useState(true);

  useEffect(() => {
    showIcon !== visibility && setIconVisibility(visibility);
  }, [visibility]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (visibility) {
      setIconVisibility(visibility);
    });
    setExposedVariable('click', async function () {
      fireEvent('onClick');
    });
  }, [setIconVisibility]);

  return (
    <div
      className={cx('icon-widget', { 'd-none': !showIcon }, { 'cursor-pointer': events.length > 0 })}
      data-cy={dataCy}
    >
      <OverlayTrigger
        overlay={<Tooltip>{tooltipMessage}</Tooltip>}
        placement="top" // Set the placement for the tooltip
        delay={{ show: 800, hide: 100 }}
      >
        <div>
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
      </OverlayTrigger>
    </div>
  );
};
