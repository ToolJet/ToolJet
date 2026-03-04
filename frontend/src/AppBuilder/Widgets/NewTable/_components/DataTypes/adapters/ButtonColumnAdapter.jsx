import React, { useCallback } from 'react';
import { Button } from '@/components/ui/Button/Button';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

export const ButtonColumn = ({
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
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onClick) onClick();
    },
    [onClick]
  );

  const variant = buttonType === 'outline' ? 'outline' : 'primary';

  let iconElement = null;
  if (iconName && iconVisibility) {
    iconElement = <TablerIcon iconName={iconName} size={14} stroke={1.5} style={iconColor ? { color: iconColor } : undefined} />;
  }

  const buttonStyle = {
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

  if (hasTooltip) {
    return (
      <OverlayTrigger
        placement="auto"
        delay={{ show: 500, hide: 0 }}
        overlay={<Tooltip>{tooltip}</Tooltip>}
      >
        <div style={{ display: 'flex' }}>{buttonElement}</div>
      </OverlayTrigger>
    );
  }

  return buttonElement;
};

export default ButtonColumn;
