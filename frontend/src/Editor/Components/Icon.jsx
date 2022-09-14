import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import cx from 'classnames';

export const Icon = ({ properties, styles, fireEvent, width, height, currentState, registerAction }) => {
  const { icon, hidden } = properties;
  const { iconColor } = styles;
  const IconElement = Icons[icon];

  const [hideIcon, setIconVisibility] = useState(false);

  useEffect(() => {
    setIconVisibility(typeof hidden !== 'boolean' ? !resolveWidgetFieldValue(hidden, currentState) : hidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  registerAction('hide', async function (hide) {
    setIconVisibility(typeof hide !== 'boolean' ? resolveWidgetFieldValue(hide, currentState) : hide);
  });

  return (
    <div className={cx('icon-widget', { 'd-none': hideIcon })}>
      <IconElement
        color={iconColor}
        style={{ width, height }}
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
