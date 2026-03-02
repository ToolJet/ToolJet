import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import useTableStore from '../../../_stores/tableStore';
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
  const getResolvedValue = useStore.getState().getResolvedValue;
  const { getTableColumnEvents } = useTableStore();

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
        const resolvedVisibility = getResolvedValue(button.buttonVisibility, { cellValue, rowData });
        if (resolvedVisibility === false) return null;

        return (
          <ButtonColumn
            key={button.id}
            buttonLabel={getResolvedValue(button.buttonLabel, { cellValue, rowData }) || 'Button'}
            buttonType={getResolvedValue(button.buttonType, { cellValue, rowData }) || 'solid'}
            disableButton={getResolvedValue(button.disableButton, { cellValue, rowData })}
            loadingState={getResolvedValue(button.loadingState, { cellValue, rowData })}
            backgroundColor={getResolvedValue(button.buttonBackgroundColor, { cellValue, rowData })}
            labelColor={getResolvedValue(button.buttonLabelColor, { cellValue, rowData })}
            iconName={getResolvedValue(button.buttonIconName, { cellValue, rowData })}
            iconVisibility={getResolvedValue(button.buttonIconVisibility, { cellValue, rowData })}
            iconColor={getResolvedValue(button.buttonIconColor, { cellValue, rowData })}
            iconAlignment={getResolvedValue(button.buttonIconAlignment, { cellValue, rowData }) || 'left'}
            loaderColor={getResolvedValue(button.buttonLoaderColor, { cellValue, rowData })}
            borderColor={getResolvedValue(button.buttonBorderColor, { cellValue, rowData })}
            borderRadius={getResolvedValue(button.buttonBorderRadius, { cellValue, rowData })}
            tooltip={getResolvedValue(button.buttonTooltip, { cellValue, rowData })}
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
