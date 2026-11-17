import React from 'react';
import PanelIconButton from './PanelIconButton';

// The close (X) button of every editor panel: 28px ghost button, 14px icon.
const PanelCloseButton = ({ onClose, dataCy, placement = 'bottom', ...buttonProps }) => (
  <PanelIconButton
    isLucid
    size="medium"
    leadingIcon="x"
    onClick={onClose}
    data-cy={dataCy}
    placement={placement}
    {...buttonProps}
  />
);

export default PanelCloseButton;
