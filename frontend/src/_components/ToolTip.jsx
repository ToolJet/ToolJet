import React from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Tooltip from 'react-bootstrap/esm/Tooltip';

export function ToolTip({ message, children, placement = 'top', trigger = ['hover', 'focus'] }) {
  return (
    <OverlayTrigger
      trigger={trigger}
      placement={placement}
      delay={{ show: 800, hide: 100 }}
      overlay={<Tooltip>{message}</Tooltip>}
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
