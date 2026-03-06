import { v4 as uuidv4 } from 'uuid';
import useStore from '@/AppBuilder/_stores/store';

export const DEFAULT_BUTTON = {
  buttonLabel: 'Button',
  buttonTooltip: '',
  disableButton: false,
  loadingState: false,
  buttonVisibility: true,
  buttonType: 'solid',
  buttonBackgroundColor: 'var(--cc-primary-brand)',
  buttonLabelColor: '#FFFFFF',
  buttonBorderColor: 'var(--cc-primary-brand)',
  buttonBorderRadius: '6',
  buttonLoaderColor: 'var(--cc-surface1-surface)',
  buttonIconName: 'IconHome2',
  buttonIconVisibility: false,
  buttonIconColor: 'var(--cc-default-icon)',
  buttonIconAlignment: 'left',
};

export const useButtonManager = ({ column, index, onColumnItemChange }) => {
  const addButton = () => {
    const newButton = { ...DEFAULT_BUTTON, id: uuidv4() };
    const updatedButtons = [...(column.buttons || []), newButton];
    onColumnItemChange(index, 'buttons', updatedButtons);
    return newButton.id;
  };

  const removeButton = (buttonId) => {
    const updatedButtons = (column.buttons || []).filter((b) => b.id !== buttonId);
    onColumnItemChange(index, 'buttons', updatedButtons);

    // Clean up events for this button
    const columnKey = column.key || column.name;
    const ref = `${columnKey}::${buttonId}`;
    const { getModuleEvents, deleteAppVersionEventHandler } = useStore.getState().eventsSlice;
    const events = getModuleEvents('canvas').filter((e) => e.target === 'table_column' && e.event?.ref === ref);
    Promise.all(events.map((e) => deleteAppVersionEventHandler(e.id))).catch((err) => {
      console.error('[useButtonManager] Failed to delete event handlers for button', buttonId, err);
    });
  };

  const updateButtonProperty = (buttonId, property, value) => {
    const updatedButtons = (column.buttons || []).map((b) => (b.id === buttonId ? { ...b, [property]: value } : b));
    onColumnItemChange(index, 'buttons', updatedButtons);
  };

  const updateButtonProperties = (buttonId, updates) => {
    const updatedButtons = (column.buttons || []).map((b) => (b.id === buttonId ? { ...b, ...updates } : b));
    onColumnItemChange(index, 'buttons', updatedButtons);
  };

  const reorderButtons = (reorderedButtons) => {
    onColumnItemChange(index, 'buttons', reorderedButtons);
  };

  const duplicateButton = (buttonId) => {
    const button = (column.buttons || []).find((b) => b.id === buttonId);
    if (!button) return null;
    const newButton = { ...button, id: uuidv4() };
    const updatedButtons = [...(column.buttons || []), newButton];
    onColumnItemChange(index, 'buttons', updatedButtons);
    return newButton.id;
  };

  const getButton = (buttonId) => {
    return (column.buttons || []).find((b) => b.id === buttonId);
  };

  return { addButton, removeButton, duplicateButton, updateButtonProperty, updateButtonProperties, reorderButtons, getButton };
};
