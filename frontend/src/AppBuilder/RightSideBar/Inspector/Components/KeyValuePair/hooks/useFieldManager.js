import { useListItemManager } from '../../shared/hooks';

/**
 * Hook for managing KeyValuePair fields
 * Wraps the generic useListItemManager with field-specific configuration
 */
export const useFieldManager = ({ component, paramUpdated, currentState }) => {
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
