import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// This overlayTriggerComponent is used in the Table component, for download and manage columns popover
export const OverlayTriggerComponent = ({
  trigger = 'click',
  overlay,
  rootClose = true,
  placement = 'top',
  children,
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
        {''}
        {modifiedChild}
      </span>
    </OverlayTrigger>
  );
};
