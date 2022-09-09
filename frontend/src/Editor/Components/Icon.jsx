import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const Icon = ({ properties, styles, fireEvent, width, height, currentState, registerAction }) => {
  const { icon, visibility } = properties;
  const { iconColor } = styles;
  const IconElement = Icons[icon];

  const [hideIcon, setIconVisibility] = useState(false);

  useEffect(() => {
    setIconVisibility(
      typeof visibility !== 'boolean' ? !resolveWidgetFieldValue(visibility, currentState) : !visibility
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  registerAction('hide', async function (hide) {
    setIconVisibility(typeof hide !== 'boolean' ? resolveWidgetFieldValue(hide, currentState) : hide);
  });

  return (
    <div className={`icon-widget`} style={{ display: hideIcon ? 'none' : '' }}>
      <IconElement
        color={iconColor}
        style={{ width: width, height: height }}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={(event) => {
          event.stopPropagation();
          fireEvent('onHover');
        }}
      />
    </div>
  );
};
