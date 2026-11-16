import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ToolTip } from '@/_components/ToolTip';

// The close (X) button of every editor panel: 28px ghost button, 14px icon, and a name that both
// screen readers (aria-label) and sighted users (tooltip) get.
const PanelCloseButton = ({ label, onClose, dataCy, placement = 'bottom', ...buttonProps }) => (
  <ToolTip message={label} placement={placement}>
    <Button
      isLucid
      iconOnly
      size="medium"
      variant="ghost"
      leadingIcon="x"
      aria-label={label}
      onClick={onClose}
      data-cy={dataCy}
      {...buttonProps}
    />
  </ToolTip>
);

export default PanelCloseButton;
