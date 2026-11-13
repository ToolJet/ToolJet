import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import useTableStore from '../../../_stores/tableStore';
import { shallow } from 'zustand/shallow';
import { ButtonColumn } from './ButtonColumnAdapter';
import { RowActionIcons, RowActionMenu } from './RowActions';
import { buttonDisplayOf } from '../../../_utils/rowActionIcon';

export const ButtonColumnGroup = ({ id, buttons = [], cellBackgroundColor, cellValue, rowData, onClick, display }) => {
  const getResolvedValue = useStore((state) => state.getResolvedValue);
  const getTableColumnEvents = useTableStore((state) => state.getTableColumnEvents, shallow);
  // Icons and the "..." menu are drawings of the ToolJet UI 2.0 look; the ToolJet look keeps its labelled buttons.
  const look = useTableStore((state) => state.getTableStyles?.(id)?.tableLook);
  const mode = look === 'shadcn' ? buttonDisplayOf(display) : 'buttons';

  if (mode !== 'buttons') {
    const context = { cellValue, rowData };
    const actions = buttons
      .filter((button) => getResolvedValue(button.buttonVisibility, context) !== false)
      .map((button) => ({
        id: button.id,
        label: getResolvedValue(button.buttonLabel, context) || 'Button',
        iconName: getResolvedValue(button.buttonIconName, context),
        iconVisible: getResolvedValue(button.buttonIconVisibility, context),
        disabled: !!getResolvedValue(button.disableButton, context),
        loading: !!getResolvedValue(button.loadingState, context),
        tooltip: getResolvedValue(button.buttonTooltip, context),
      }));
    const run = (buttonId) => onClick?.(buttonId, getTableColumnEvents(id));
    return mode === 'menu' ? (
      <RowActionMenu actions={actions} onAction={run} />
    ) : (
      <RowActionIcons actions={actions} onAction={run} />
    );
  }

  return (
    <div
      className="h-100 d-flex align-items-center"
      style={{
        gap: '6px',
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
