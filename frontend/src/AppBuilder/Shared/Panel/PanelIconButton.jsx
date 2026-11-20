import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/Button/Button';
import { ToolTip } from '@/_components/ToolTip';

// Every icon-only button in the editor chrome: screen readers announce `label` and sighted users see
// it as the hover tooltip. The ref reaches the button, so a popover's OverlayTrigger can wrap it.
const PanelIconButton = forwardRef(({ label, placement = 'top', ...buttonProps }, ref) => (
  <ToolTip message={label} placement={placement}>
    <Button ref={ref} iconOnly variant="ghost" aria-label={label} {...buttonProps} />
  </ToolTip>
));

PanelIconButton.displayName = 'PanelIconButton';
PanelIconButton.propTypes = { label: PropTypes.string.isRequired, placement: PropTypes.string };

export default PanelIconButton;
