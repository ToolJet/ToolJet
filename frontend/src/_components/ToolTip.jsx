import React from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Tooltip from 'react-bootstrap/esm/Tooltip';

export function ToolTip({
  message,
  children,
  placement = 'top',
  trigger = ['hover', 'focus'],
  delay = { show: 50, hide: 100 },
  show = true,
}) {
  if (!show) {
    return children;
  }
  return (
    <OverlayTrigger trigger={trigger} placement={placement} delay={delay} overlay={<Tooltip>{message}</Tooltip>}>
      {children}
    </OverlayTrigger>
  );
}
ToolTip.propTypes = {
  message: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
  placement: PropTypes.string,
  trigger: PropTypes.array,
};
