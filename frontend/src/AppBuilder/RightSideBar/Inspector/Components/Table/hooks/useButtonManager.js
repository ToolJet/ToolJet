import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDataStore } from '@/_stores/appDataStore';

export const DEFAULT_BUTTON = {
  buttonLabel: 'Button',
  buttonTooltip: '',
  disableButton: false,
  loadingState: false,
  buttonVisibility: true,
  buttonType: 'solid',
  buttonBackgroundColor: 'var(--cc-primary-brand)',
  buttonLabelColor: 'var(--cc-surface1-surface)',
  buttonBorderColor: 'var(--cc-weak-border)',
  buttonBorderRadius: '6',
  buttonLoaderColor: 'var(--cc-surface1-surface)',
  buttonIconName: 'IconHome2',
  buttonIconVisibility: false,
  buttonIconColor: 'var(--cc-surface1-surface)',
  buttonIconAlignment: 'left',
};

export const useButtonManager = ({ column, index, onColumnItemChange }) => {
  const addButton = useCallback(() => {
    const newButton = { ...DEFAULT_BUTTON, id: uuidv4() };
    const updatedButtons = [...(column.buttons || []), newButton];
    onColumnItemChange(index, 'buttons', updatedButtons);
    return newButton.id;
  }, [column, index, onColumnItemChange]);

  const removeButton = useCallback(
    (buttonId) => {
      const updatedButtons = (column.buttons || []).filter((b) => b.id !== buttonId);
      onColumnItemChange(index, 'buttons', updatedButtons);

      // Clean up events for this button
      const columnKey = column.key || column.name;
      const ref = `${columnKey}::${buttonId}`;
      const events = useAppDataStore.getState().events.filter(
        (e) => e.target === 'table_column' && e.event?.ref === ref
      );
      events.forEach((e) => useAppDataStore.getState().actions.deleteAppVersionEventHandler(e.id));
    },
    [column, index, onColumnItemChange]
  );

  const updateButtonProperty = useCallback(
    (buttonId, property, value) => {
      const updatedButtons = (column.buttons || []).map((b) =>
        b.id === buttonId ? { ...b, [property]: value } : b
      );
      onColumnItemChange(index, 'buttons', updatedButtons);
    },
    [column, index, onColumnItemChange]
  );

  const reorderButtons = useCallback(
    (reorderedButtons) => {
      onColumnItemChange(index, 'buttons', reorderedButtons);
    },
    [index, onColumnItemChange]
  );

  const duplicateButton = useCallback(
    (buttonId) => {
      const button = (column.buttons || []).find((b) => b.id === buttonId);
      if (!button) return null;
      const newButton = { ...button, id: uuidv4() };
      const updatedButtons = [...(column.buttons || []), newButton];
      onColumnItemChange(index, 'buttons', updatedButtons);
      return newButton.id;
    },
    [column, index, onColumnItemChange]
  );

  const getButton = useCallback(
    (buttonId) => {
      return (column.buttons || []).find((b) => b.id === buttonId);
    },
    [column]
  );

  return { addButton, removeButton, duplicateButton, updateButtonProperty, reorderButtons, getButton };
};
