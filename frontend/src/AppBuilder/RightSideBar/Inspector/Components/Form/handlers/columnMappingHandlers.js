import { isEqual } from 'lodash';
import { FORM_STATUS, COMPONENT_LAYOUT_DETAILS } from '../constants';
import { findNextElementTop, cleanupFormFields } from '../utils/utils';
import { updateFormFieldComponent } from '../utils/fieldOperations';

export const createColumnMappingHandler = ({
  component,
  isFormGenerated,
  currentStatusRef,
  formFields,
  formFieldsWithComponentDefinition,
  getChildComponents,
  currentLayout,
  performBatchComponentOperations,
  saveDataSection,
  setOpenModal,
}) => {
  return (columns, isSingleUpdate = false) => {
    const newColumns = isSingleUpdate ? formFields.filter((field) => field.componentId !== columns[0].componentId) : [];
    let operations = {
        updated: {},
        added: {},
        deleted: [],
      },
      componentsToBeRemoved = [];

    const isFormRegeneration = isFormGenerated && currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS;

    if (!isSingleUpdate) {
      if (isFormRegeneration) {
        formFields.forEach((field) => {
          if (!field.isCustomField) {
            componentsToBeRemoved.push(field.componentId);
            operations.deleted.push(field.componentId);
          } else {
            newColumns.push(field);
          }
        });
      } else if (currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS) {
        newColumns.push(...formFields);
      } else {
        formFields.forEach((field) => {
          if (field.isCustomField) {
            newColumns.push(field);
          }
        });
        columns.forEach((column) => {
          if (column.isRemoved) {
            componentsToBeRemoved.push(column.componentId);
          }
        });
      }
    }

    const childComponents = getChildComponents(component?.id);
    // Get the last position of the child components
    const nextElementsTop = findNextElementTop(childComponents, currentLayout, componentsToBeRemoved);
    // Create form field components from columns

    if (columns && Array.isArray(columns) && columns.length > 0) {
      let nextTop = nextElementsTop + COMPONENT_LAYOUT_DETAILS.spacing;

      columns.forEach((column, index) => {
        if (column.isRemoved) return operations.deleted.push(column.componentId);

        if (currentStatusRef.current === FORM_STATUS.REFRESH_FIELDS) {
          delete column.isRemoved;
          delete column.isNew;
          delete column.isExisting;
          if (
            isEqual(
              column,
              formFieldsWithComponentDefinition.find((field) => field.componentId === column.componentId)
            )
          ) {
            return newColumns.push(column);
          }
        }

        if (
          currentStatusRef.current === FORM_STATUS.MANAGE_FIELDS &&
          isEqual(
            column,
            formFieldsWithComponentDefinition.find((field) => field.componentId === column.componentId)
          )
        ) {
          return newColumns.push(column);
        }

        const {
          added = {},
          updated = {},
          deleted = false,
        } = updateFormFieldComponent(column, {}, component.id, nextTop);

        if (Object.keys(updated).length !== 0) {
          operations.updated[column.componentId] = updated;
          newColumns.push(column);
        }
        if (Object.keys(added).length !== 0) {
          operations.added[added.id] = added;
          if (added.component.component === 'Checkbox') {
            nextTop = nextTop + added.layouts['desktop'].height + 10;
          } else {
            nextTop = nextTop + added.layouts['desktop'].height + COMPONENT_LAYOUT_DETAILS.spacing;
          }

          // Create simplified column structure with only the required fields
          const simplifiedColumn = {
            componentId: added.id,
            isCustomField: column.isCustomField ?? false,
            dataType: column.dataType,
            key: column.key || column.name,
          };

          columns[index] = simplifiedColumn; // Replace with simplified structure
          newColumns.push(simplifiedColumn);
        }
        if (deleted) {
          operations.deleted.push(column.componentId);
        }
      });

      if (
        Object.keys(operations.updated).length > 0 ||
        Object.keys(operations.added).length > 0 ||
        operations.deleted.length > 0
      ) {
        performBatchComponentOperations(operations);
        saveDataSection(cleanupFormFields(newColumns));
      }
      setOpenModal(false);
    }
  };
};
