import React from 'react';
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
  const handleClick = () => {
    if (onClick) onClick();
  };

  const variant = buttonType === 'outline' ? 'outline' : 'primary';
  const isOutline = variant === 'outline';

  // Compute colors based on solid/outline mode, matching Button widget behavior.
  // When colors are at defaults, adapt them to the current mode.
  // When user has customized, keep the custom value.
  const DEFAULT_LABEL_COLORS = ['#FFFFFF', '#ffffff', 'var(--cc-surface1-surface)'];
  const DEFAULT_BG_COLORS = ['#4368E3', '#4368e3', 'var(--cc-primary-brand)'];
  const DEFAULT_BORDER_COLORS = [...DEFAULT_BG_COLORS, 'var(--cc-weak-border)'];
  const DEFAULT_ICON_COLORS = [
    'var(--cc-default-icon)',
    'var(--cc-default-icon)',
    'var(--cc-surface1-surface)',
    '#FFFFFF',
    '#ffffff',
  ];
  const DEFAULT_LOADER_COLORS = ['#FFFFFF', '#ffffff', 'var(--cc-surface1-surface)'];

  const isDefaultLabel = !labelColor || DEFAULT_LABEL_COLORS.includes(labelColor);
  const isDefaultIcon = !iconColor || DEFAULT_ICON_COLORS.includes(iconColor);
  const isDefaultBg = !backgroundColor || DEFAULT_BG_COLORS.includes(backgroundColor);
  const isDefaultBorder = !borderColor || DEFAULT_BORDER_COLORS.includes(borderColor);
  const isDefaultLoader = !loaderColor || DEFAULT_LOADER_COLORS.includes(loaderColor);

  const computedBgColor = isDefaultBg
    ? isOutline
      ? 'transparent'
      : 'var(--cc-primary-brand)'
    : isOutline
    ? 'transparent'
    : backgroundColor;

  const computedLabelColor = isDefaultLabel
    ? isOutline
      ? 'var(--cc-primary-text)'
      : 'var(--text-on-solid)'
    : labelColor;

  const computedIconColor = isDefaultIcon ? (isOutline ? 'var(--cc-default-icon)' : 'var(--icon-on-solid)') : iconColor;

  const computedBorderColor = isDefaultBorder ? (isOutline ? 'var(--borders-strong)' : undefined) : borderColor;

  const computedLoaderColor = isDefaultLoader ? (isOutline ? 'var(--cc-primary-brand)' : '#FFFFFF') : loaderColor;

  let iconElement = null;
  if (iconName && iconVisibility) {
    iconElement = <TablerIcon iconName={iconName} size={14} stroke={1.5} style={{ color: computedIconColor }} />;
  }

  const buttonStyle = {
    padding: '4px 10px',
    borderRadius: borderRadius ? `${borderRadius}px` : '6px',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '20px',
    gap: '6px',
    height: '28px',
    backgroundColor: computedBgColor,
    color: computedLabelColor,
  };
  if (computedBorderColor) {
    buttonStyle.borderColor = computedBorderColor;
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
      fill={computedLoaderColor || undefined}
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
      <OverlayTrigger placement="auto" delay={{ show: 500, hide: 0 }} overlay={<Tooltip>{tooltip}</Tooltip>}>
        <div style={{ display: 'flex' }}>{buttonElement}</div>
      </OverlayTrigger>
    );
  }

  return buttonElement;
};

export default ButtonColumn;
