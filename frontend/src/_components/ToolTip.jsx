import React from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Tooltip from 'react-bootstrap/esm/Tooltip';
import 'bootstrap/dist/css/bootstrap.min.css';

export function ToolTip({
  message,
  children,
  placement = 'top',
  trigger = ['hover', 'focus'],
  delay = { show: 50, hide: 100 },
  show = true,
  tooltipClassName = '',
  style = {},
}) {
  if (!show) {
    return children;
  }
  return (
    <OverlayTrigger
      trigger={trigger}
      placement={placement}
      delay={delay}
      overlay={
        <Tooltip style={style} className={tooltipClassName}>
          {message}
        </Tooltip>
      }
    >
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
