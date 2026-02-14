import React, { useCallback } from 'react';
import { Button } from '@/components/ui/Button/Button';
// eslint-disable-next-line import/no-unresolved
import * as TablerIcons from '@tabler/icons-react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import useTableStore from '../../../_stores/tableStore';

export const ButtonColumn = ({
  id,
  buttonLabel,
  buttonType,
  disableButton,
  loadingState,
  backgroundColor,
  labelColor,
  iconName,
  iconVisibility,
  iconColor,
  iconAlignment,
  loaderColor,
  borderColor,
  borderRadius,
  tooltip,
  onClick,
}) => {
  const { getTableColumnEvents } = useTableStore();

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onClick) {
        onClick(getTableColumnEvents(id));
      }
    },
    [onClick, id, getTableColumnEvents]
  );

  const variant = buttonType === 'outline' ? 'outline' : 'primary';

  let iconElement = null;
  if (iconName && iconVisibility) {
    const IconComponent = TablerIcons[iconName];
    if (IconComponent) {
      iconElement = <IconComponent size={14} stroke={1.5} style={iconColor ? { color: iconColor } : undefined} />;
    }
  }

  const buttonStyle = {
    flex: '1 0 0',
    padding: '6px 12px',
    borderRadius: borderRadius ? `${borderRadius}px` : '6px',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    gap: '6px',
    height: 'auto',
  };
  if (buttonType === 'solid' && backgroundColor) {
    buttonStyle.backgroundColor = backgroundColor;
  }
  if (labelColor) {
    buttonStyle.color = labelColor;
  }
  if (borderColor) {
    buttonStyle.borderColor = borderColor;
    buttonStyle.borderStyle = 'solid';
    buttonStyle.borderWidth = '1px';
  }
  if (disableButton) {
    buttonStyle.opacity = '50%';
  }

  const buttonElement = (
    <Button
      variant={variant}
      size="default"
      isLoading={!!loadingState}
      disabled={!!disableButton}
      fill={loaderColor || undefined}
      style={buttonStyle}
      onClick={handleClick}
    >
      {iconAlignment === 'left' && iconElement}
      {buttonLabel || 'Button'}
      {iconAlignment === 'right' && iconElement}
    </Button>
  );

  const hasTooltip = tooltip && tooltip.toString().trim();

  return (
    <div className="h-100 d-flex align-items-center" style={{ padding: '0 6px', width: '100%' }}>
      {hasTooltip ? (
        <OverlayTrigger
          placement="auto"
          delay={{ show: 500, hide: 0 }}
          overlay={<Tooltip>{tooltip}</Tooltip>}
        >
          <div style={{ flex: '1 0 0', display: 'flex' }}>{buttonElement}</div>
        </OverlayTrigger>
      ) : (
        buttonElement
      )}
    </div>
  );
};

export default ButtonColumn;
