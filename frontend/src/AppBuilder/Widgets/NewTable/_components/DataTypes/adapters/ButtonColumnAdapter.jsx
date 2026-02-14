import React, { useCallback } from 'react';
import { Button } from '@/components/ui/Button/Button';
// eslint-disable-next-line import/no-unresolved
import { DynamicIcon } from 'lucide-react/dynamic.mjs';
import useTableStore from '../../../_stores/tableStore';
import { determineJustifyContentValue } from '@/_helpers/utils';

export const ButtonColumn = ({
  id,
  buttonLabel,
  buttonType,
  disableButton,
  loadingState,
  backgroundColor,
  labelColor,
  iconName,
  iconColor,
  iconAlignment,
  loaderColor,
  borderColor,
  horizontalAlignment,
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

  const iconElement = iconName ? (
    <DynamicIcon name={iconName} size={12} style={iconColor ? { color: iconColor } : undefined} />
  ) : null;

  const buttonStyle = {};
  if (buttonType === 'solid' && backgroundColor) {
    buttonStyle.backgroundColor = backgroundColor;
  }
  if (labelColor) {
    buttonStyle.color = labelColor;
  }
  if (borderColor) {
    buttonStyle.borderColor = borderColor;
  }

  return (
    <div
      className={`h-100 d-flex align-items-center justify-content-${determineJustifyContentValue(horizontalAlignment || 'center')}`}
    >
      <Button
        variant={variant}
        size="small"
        isLoading={!!loadingState}
        disabled={!!disableButton}
        fill={loaderColor || undefined}
        style={Object.keys(buttonStyle).length > 0 ? buttonStyle : undefined}
        onClick={handleClick}
      >
        {iconAlignment === 'left' && iconElement}
        {buttonLabel || 'Button'}
        {iconAlignment === 'right' && iconElement}
      </Button>
    </div>
  );
};

export default ButtonColumn;
