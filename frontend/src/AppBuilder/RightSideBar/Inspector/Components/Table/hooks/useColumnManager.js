import { useCallback } from 'react';
import { useListItemManager } from '../../shared/hooks';
import { useAppDataStore } from '@/_stores/appDataStore';

/**
 * Hook for managing Table columns
 * Wraps the generic useListItemManager with column-specific configuration
 */
export const useColumnManager = ({ component, paramUpdated, currentState }) => {
  // Delete events helper
  const deleteEvents = useCallback(async (ref, eventTarget) => {
    const events = useAppDataStore.getState().events.filter((event) => event.target === eventTarget);
    const toDelete = events?.filter((e) => e.event?.ref === ref.ref);

    return Promise.all(
      toDelete?.map((e) => useAppDataStore.getState().actions.deleteAppVersionEventHandler(e.id)) || []
    );
  }, []);

  // Handle column-specific property changes
  const handlePropertyChange = useCallback((column, property, value) => {
    let modifiedColumn = { ...column };

    // Handle select/multiselect default options
    if (property === 'columnType' && (value === 'select' || value === 'newMultiSelect')) {
      if (modifiedColumn.options?.length > 0) {
        modifiedColumn.options = modifiedColumn.options.map((opt) => {
          const { makeDefaultOption, ...rest } = opt;
          return rest;
        });
      }
      modifiedColumn.defaultOptionsList = [];
    }

    // Handle datepicker initialization
    if (property === 'columnType' && value === 'datepicker') {
      modifiedColumn = {
        ...modifiedColumn,
        isTimeChecked: false,
        dateFormat: 'DD/MM/YYYY',
        parseDateFormat: 'DD/MM/YYYY',
        isDateSelectionEnabled: true,
      };
    }

    // Handle button column initialization
    if (property === 'columnType' && value === 'button') {
      modifiedColumn = {
        ...modifiedColumn,
        buttonLabel: 'Button',
        buttonType: 'solid',
        disableButton: false,
        loadingState: false,
        buttonBackgroundColor: 'var(--cc-primary-brand)',
        buttonLabelColor: 'var(--cc-surface1-surface)',
        buttonIconName: 'IconHome2',
        buttonIconVisibility: false,
        buttonIconColor: 'var(--cc-surface1-surface)',
        buttonIconAlignment: 'left',
        buttonLoaderColor: 'var(--cc-surface1-surface)',
        buttonBorderColor: 'var(--cc-weak-border)',
        buttonBorderRadius: '6',
        buttonTooltip: '',
      };
    }

    return modifiedColumn;
  }, []);

  // Handle column removal (deletion history + event cleanup)
  const handleRemove = useCallback(
    async (removedColumns, index, ref) => {
      // Update column deletion history
      const existingColumnDeletionHistory =
        component.component.definition.properties.columnDeletionHistory?.value ?? [];
      const newColumnDeletionHistory = [
        ...existingColumnDeletionHistory,
        ...removedColumns.map((column) => column.key || column.name),
      ];
      await paramUpdated({ name: 'columnDeletionHistory' }, 'value', newColumnDeletionHistory, 'properties', true);

      // Delete associated events
      if (ref) {
        await deleteEvents({ ref }, 'table_column');
      }
    },
    [component, paramUpdated, deleteEvents]
  );

  const listManager = useListItemManager({
    component,
    paramUpdated,
    currentState,
    config: {
      propertyName: 'columns',
      typeProp: 'columnType',
      nonEditableTypes: ['link', 'image'],
      namePrefix: 'new_column',
      defaultItemProps: {
        includeKey: true,
      },
      onPropertyChange: handlePropertyChange,
      onRemove: handleRemove,
    },
  });

  // Return with renamed properties to maintain API compatibility
  return {
    columns: listManager.items,
    filteredColumns: listManager.filteredItems,
    isAllColumnsEditable: listManager.isAllEditable,
    addColumn: listManager.addItem,
    removeColumn: listManager.removeItem,
    duplicateColumn: listManager.duplicateItem,
    reorderColumns: listManager.reorderItems,
    updateColumnProperty: listManager.updateProperty,
    updateColumnEvents: listManager.updateEvents,
    setAllColumnsEditable: listManager.setAllEditable,
    getPopoverFieldSource: listManager.getPopoverFieldSource,
    deleteEvents,
  };
};
