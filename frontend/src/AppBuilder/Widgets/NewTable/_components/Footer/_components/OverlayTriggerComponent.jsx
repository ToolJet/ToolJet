import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Tooltip } from 'react-tooltip';

// This overlayTriggerComponent is used in the Table component, for download, manage columns popover and pagination
export const OverlayTriggerComponent = ({
  trigger = 'click',
  overlay,
  rootClose = true,
  placement = 'top',
  children,
  tooltipId,
}) => {
  const [isOpen, setOpen] = useState(false);
  const modifiedChild = React.cloneElement(children, {
    className: `${children.props.className} ${isOpen && 'always-active-btn'}`,
  });

  return (
    <OverlayTrigger
      trigger={trigger}
      overlay={overlay}
      rootClose={rootClose}
      placement={placement}
      show={isOpen}
      onToggle={(show) => {
        setOpen(show);
      }}
    >
      <span>
        {tooltipId && <Tooltip id={tooltipId} className="tooltip" />}
        {modifiedChild}
      </span>
    </OverlayTrigger>
  );
};
