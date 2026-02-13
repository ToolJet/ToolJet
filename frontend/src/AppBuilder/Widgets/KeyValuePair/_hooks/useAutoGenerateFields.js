import { useEffect, useMemo } from 'react';
import { isEqual, isEmpty } from 'lodash';
import { usePrevious } from '@dnd-kit/utilities';
import useStore from '@/AppBuilder/_stores/store';
import autoGenerateFields from '../_utils/autoGenerateFields';

/**
 * Hook to handle auto-generation of fields for KeyValuePair widget
 * Persists generated fields and creation/deletion history
 */
export const useAutoGenerateFields = ({
  data = {},
  fields = [],
  fieldDeletionHistory = [],
  useDynamicField = false,
  fieldDynamicData = [],
  id,
}) => {
  // Track previous data to detect changes
  const prevData = usePrevious(data);

  // Auto-generate and persist fields when data changes
  useEffect(() => {
    // Only auto-generate if data has changed and is not empty
    if (useDynamicField || isEqual(prevData, data) || isEmpty(data)) {
      return;
    }

    // Read raw (unresolved) field definitions to preserve fx expressions
    const componentDef = useStore.getState().getComponentDefinition(id);
    const rawFields = componentDef?.component?.definition?.properties?.fields?.value ?? [];
    const generatedFields = autoGenerateFields(data, rawFields, fieldDeletionHistory, useDynamicField, []);

    // Only persist if fields have changed
    if (!isEqual(rawFields, generatedFields)) {
      const setComponentProperty = useStore.getState().setComponentProperty;
      setComponentProperty(id, 'fields', generatedFields, 'properties', 'value', false, 'canvas', {
        skipUndoRedo: true,
        saveAfterAction: true,
      });
    }
  }, [data, prevData, fieldDeletionHistory, useDynamicField, id]);

  // Resolve fields for rendering (handles dynamic field mode and visibility filtering)
  const resolvedFields = useMemo(() => {
    let fieldList = fields;

    // If using dynamic fields, use dynamic field data
    if (useDynamicField) {
      fieldList = autoGenerateFields(data, [], [], true, fieldDynamicData);
    } else if (!fieldList || fieldList.length === 0) {
      // Fallback: auto-generate fields for initial render before effect runs
      fieldList = autoGenerateFields(data, [], fieldDeletionHistory, false, []);
    }

    // Filter out hidden fields
    return fieldList.filter((field) => field.fieldVisibility !== false);
  }, [fields, data, useDynamicField, fieldDynamicData, fieldDeletionHistory]);

  return resolvedFields;
};
