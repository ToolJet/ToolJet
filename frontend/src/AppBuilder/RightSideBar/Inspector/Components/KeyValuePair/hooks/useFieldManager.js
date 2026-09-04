import { useListItemManager } from '../../shared/hooks';
import { useCallback } from 'react';

/**
 * Hook for managing KeyValuePair fields
 * Wraps the generic useListItemManager with field-specific configuration
 */
export const useFieldManager = ({ component, paramUpdated, currentState }) => {
  const handlePropertyChange = useCallback((field, property, value) => {
    let modifiedField = { ...field };

    // Handle select/multiselect default options
    if (property === 'fieldType' && (value === 'select' || value === 'newMultiSelect')) {
      if (modifiedField.options?.length > 0) {
        modifiedField.options = modifiedField.options.map((opt) => {
          const { makeDefaultOption, ...rest } = opt;
          return rest;
        });
      }
      modifiedField.defaultOptionsList = [];
    }

    // Handle datepicker initialization
    if (property === 'fieldType' && value === 'datepicker') {
      modifiedField = {
        ...modifiedField,
        isTimeChecked: false,
        dateFormat: 'DD/MM/YYYY',
        parseDateFormat: 'DD/MM/YYYY',
        isDateSelectionEnabled: true,
      };
    }

    return modifiedField;
  }, []);

  // Deletion history is saved with the field list - a separate save can be lost, letting the field regenerate
  const handleRemoveUpdates = useCallback(
    (removedFields) => {
      const existingFieldDeletionHistory = component.component.definition.properties.fieldDeletionHistory?.value ?? [];

      return [
        {
          name: 'fieldDeletionHistory',
          value: [...existingFieldDeletionHistory, ...removedFields.map((field) => field.key || field.name)],
        },
      ];
    },
    [component]
  );

  const listManager = useListItemManager({
    component,
    paramUpdated,
    currentState,
    config: {
      propertyName: 'fields',
      typeProp: 'fieldType',
      nonEditableTypes: ['link', 'image'],
      namePrefix: 'new_field',
      defaultItemProps: {
        includeKey: true, // Fields have a 'key' property
      },
      onPropertyChange: handlePropertyChange,
      onRemoveUpdates: handleRemoveUpdates,
    },
  });

  // Return with renamed properties to maintain API compatibility
  return {
    fields: listManager.items,
    filteredFields: listManager.filteredItems,
    isAllFieldsEditable: listManager.isAllEditable,
    addField: listManager.addItem,
    removeField: listManager.removeItem,
    duplicateField: listManager.duplicateItem,
    reorderFields: listManager.reorderItems,
    updateFieldProperty: listManager.updateProperty,
    updateFieldEvents: listManager.updateEvents,
    setAllFieldsEditable: listManager.setAllEditable,
    getPopoverFieldSource: listManager.getPopoverFieldSource,
  };
};
