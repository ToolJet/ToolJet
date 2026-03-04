import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { ButtonColumn } from './ButtonColumnAdapter';

export const ButtonColumnGroup = ({
  id,
  buttons = [],
  horizontalAlignment = 'left',
  cellBackgroundColor,
  cellValue,
  rowData,
  onClick,
}) => {
  const getResolvedValue = useStore((state) => state.getResolvedValue);
  const getTableColumnEvents = useTableStore((state) => state.getTableColumnEvents, shallow);

  const justifyContent =
    horizontalAlignment === 'center' ? 'center' : horizontalAlignment === 'right' ? 'flex-end' : 'flex-start';

  return (
    <div
      className="h-100 d-flex align-items-center"
      style={{
        padding: '0 6px',
        gap: '6px',
        justifyContent,
        backgroundColor: undefined,
      }}
    >
      {buttons.map((button) => {
        const context = { cellValue, rowData };
        const resolvedVisibility = getResolvedValue(button.buttonVisibility, context);
        if (resolvedVisibility === false) return null;

        const resolvedLabel = getResolvedValue(button.buttonLabel, context) || 'Button';
        const resolvedType = getResolvedValue(button.buttonType, context) || 'solid';
        const resolvedDisable = getResolvedValue(button.disableButton, context);
        const resolvedLoading = getResolvedValue(button.loadingState, context);
        const resolvedBgColor = getResolvedValue(button.buttonBackgroundColor, context);
        const resolvedLabelColor = getResolvedValue(button.buttonLabelColor, context);
        const resolvedIconName = getResolvedValue(button.buttonIconName, context);
        const resolvedIconVisibility = getResolvedValue(button.buttonIconVisibility, context);
        const resolvedIconColor = getResolvedValue(button.buttonIconColor, context);
        const resolvedIconAlignment = getResolvedValue(button.buttonIconAlignment, context) || 'left';
        const resolvedLoaderColor = getResolvedValue(button.buttonLoaderColor, context);
        const resolvedBorderColor = getResolvedValue(button.buttonBorderColor, context);
        const resolvedBorderRadius = getResolvedValue(button.buttonBorderRadius, context);
        const resolvedTooltip = getResolvedValue(button.buttonTooltip, context);

        return (
          <ButtonColumn
            key={button.id}
            buttonLabel={resolvedLabel}
            buttonType={resolvedType}
            disableButton={resolvedDisable}
            loadingState={resolvedLoading}
            backgroundColor={resolvedBgColor}
            labelColor={resolvedLabelColor}
            iconName={resolvedIconName}
            iconVisibility={resolvedIconVisibility}
            iconColor={resolvedIconColor}
            iconAlignment={resolvedIconAlignment}
            loaderColor={resolvedLoaderColor}
            borderColor={resolvedBorderColor}
            borderRadius={resolvedBorderRadius}
            tooltip={resolvedTooltip}
            onClick={() => {
              if (onClick) onClick(button.id, getTableColumnEvents(id));
            }}
          />
        );
      })}
    </div>
  );
};

export default ButtonColumnGroup;
