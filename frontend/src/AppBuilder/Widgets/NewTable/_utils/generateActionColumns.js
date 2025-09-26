import React from 'react';
import { ActionButtons } from '../_components/ActionButtons/ActionButtons';

// Function to calculate text width using improved canvas measurement
const calculateTextWidth = (text) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Use the exact font properties from the CSS
  // .btn-sm has font-size: .75rem which is typically 12px
  // IBM Plex Sans is the primary font family used in the app
  context.font = '500 12px "IBM Plex Sans"';

  const textMetrics = context.measureText(text);
  const textWidth = textMetrics.width;

  // Add padding from .btn-sm: .125rem .5rem = 2px 8px (top/bottom left/right)
  // Add border: typically 1px on each side
  // Add margins from .m-1: .25rem = 4px on each side
  const horizontalPadding = 16; // 8px left + 8px right
  const horizontalBorder = 2; // 1px left + 1px right
  const horizontalMargin = 8; // 4px left + 4px right

  return textWidth + horizontalPadding + horizontalBorder + horizontalMargin;
};

// Function to calculate total width needed for action buttons
const calculateActionColumnWidth = (actions) => {
  if (!actions || actions.length === 0) return 90; // minimum width

  let totalWidth = 0;
  const containerPadding = 24; // container padding

  actions.forEach((action) => {
    const buttonWidth = calculateTextWidth(action.buttonText || action.name || 'Button');
    totalWidth += buttonWidth;
  });

  // Add container padding and 2px as the calculation is not accurate in the decimal values
  totalWidth += containerPadding + 2;

  // Ensure minimum width
  return Math.max(90, totalWidth);
};

export const generateActionColumns = ({ actions, fireEvent, setExposedVariables, id }) => {
  const leftActions = actions?.filter((action) => action.position === 'left') || [];
  const rightActions = actions?.filter((action) => [undefined, 'right'].includes(action.position)) || [];

  const createActionColumn = (position) => {
    const actionsForPosition = position === 'left' ? leftActions : rightActions;
    const calculatedWidth = calculateActionColumnWidth(actionsForPosition);

    return {
      id: `${position}Actions`,
      accessorKey: 'actions',
      enableResizing: false,
      meta: { columnType: 'action', position, skipFilter: true, skipAddNewRow: true },
      size: calculatedWidth,
      header: 'Actions',
      cell: ({ row, cell }) => (
        <ActionButtons
          actions={actionsForPosition}
          row={row}
          cell={cell}
          fireEvent={fireEvent}
          setExposedVariables={setExposedVariables}
          id={id}
        />
      ),
    };
  };

  const columns = [];
  if (leftActions.length > 0) columns.push(createActionColumn('left'));
  if (rightActions.length > 0) columns.push(createActionColumn('right'));

  return columns;
};
