import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button/Button';
import LabeledDivider from './LabeledDivider';
import ColumnMappingComponent from './ColumnMappingComponent';
import { FormFieldsList } from './FormFieldsList';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import FieldPopoverContent from './FieldPopoverContent';
import { useDropdownState } from './hooks/useDropdownState';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import {
  parseDataAndBuildFields,
  findNextElementTop,
  analyzeJsonDifferences,
  mergeFieldsWithComponentDefinition,
  mergeFormFieldsWithNewData,
} from './utils/utils';
import { updateFormFieldComponent, createNewComponentFromMeta } from './utils/fieldOperations';
import { merge, isEqual } from 'lodash';
import { FORM_STATUS, COMPONENT_LAYOUT_DETAILS } from './constants';

/* IMPORTANT - mandatory and selected (visibility) properties are objects with value and fxActive 
               This is to support dynamic values and fx expressions in the form fields.
               When using these properties, ensure to access the value like so: field.mandatory.value
               or field.selected.value.
               Rest all the fields are directly accessible as strings or booleans.
               For example: field.label, field.name, field.value, etc.
*/

const DataSectionUI = ({ component, darkMode = false, buttonDetails, saveDataSection, currentStatusRef }) => {
  const {
    resolveReferences,
    getChildComponents,
    currentLayout,
    getComponentDefinition,
    performBatchComponentOperations,
    getFormFields,
    saveFormFields,
    getFormDataSectionData,
  } = useStore(
    (state) => ({
      resolveReferences: state.resolveReferences,
      getChildComponents: state.getChildComponents,
      currentLayout: state.currentLayout,
      getComponentDefinition: state.getComponentDefinition,
      performBatchComponentOperations: state.performBatchComponentOperations,
      getFormFields: state.getFormFields,
      saveFormFields: state.saveFormFields,
      getFormDataSectionData: state.getFormDataSectionData,
    }),
    shallow
  );

  const existingData = getFormDataSectionData(component?.id);
  const isFormGenerated = getFormDataSectionData(component.id).generateFormFrom?.value ?? false;

  const formFields = useMemo(() => getFormFields(component.id) || [], [getFormFields, component.id]);
  const formFieldsWithComponentDefinition = useMemo(
    () => mergeFieldsWithComponentDefinition(formFields, getComponentDefinition),
    [formFields, getComponentDefinition]
  );

  let JSONData = null,
    existingResolvedJsonData = existingData?.JSONData?.value;

  JSONData = component.component.definition.properties['JSONData']?.value;
  const newResolvedJsonData = resolveReferences('canvas', JSONData);
  if (existingData?.generateFormFrom?.value === 'rawJson')
    existingResolvedJsonData = resolveReferences('canvas', existingResolvedJsonData);

  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);
  const addFieldButtonRef = useRef(null);

  const buildColumns = () => {
    if (currentStatusRef.current === FORM_STATUS.MANAGE_FIELDS) {
      return formFieldsWithComponentDefinition;
    } else if (currentStatusRef.current === FORM_STATUS.REFRESH_FIELDS) {
      const jsonDifferences = analyzeJsonDifferences(newResolvedJsonData, existingResolvedJsonData);
      const mergedJsonData = merge({}, existingResolvedJsonData, newResolvedJsonData);
      const parsedFields = parseDataAndBuildFields(mergedJsonData, jsonDifferences);
      const mergedFields = mergeFormFieldsWithNewData(formFieldsWithComponentDefinition, parsedFields);
      const enhancedFieldsWithComponentDefinition = mergeFieldsWithComponentDefinition(
        mergedFields,
        getComponentDefinition
      );

      return enhancedFieldsWithComponentDefinition;
    }
    return parseDataAndBuildFields(newResolvedJsonData);
  };

  const handleDeleteField = (field) => {
    const updatedFields = formFields.filter((f) => f.componentId !== field.componentId);
    let operations = {
      updated: {},
      added: {},
      deleted: [field.componentId],
    };
    performBatchComponentOperations(operations);
    saveFormFields(component.id, updatedFields);
  };

  const handleAddField = (newField) => {
    const updatedFields = {
      componentType: newField.componentType,
      name: 'custom',
      mandatory: newField.mandatory,
      label: newField.label,
      value: '',
      placeholder: newField.placeholder,
      selected: { value: `{{true}}` },
      isCustomField: true,
    };
    const childComponents = getChildComponents(component?.id);
    // Get the last position of the child components
    const nextElementsTop = findNextElementTop(childComponents, currentLayout);
    const { added = {} } = createNewComponentFromMeta(
      updatedFields,
      component.id,
      nextElementsTop + COMPONENT_LAYOUT_DETAILS.spacing
    );
    let operations = {
      updated: {},
      added: {},
      deleted: [],
    };
    operations.added[added.id] = added;

    performBatchComponentOperations(operations);
    saveFormFields(component.id, [...formFields, { componentId: added.id, isCustomField: true }]);
    setShowAddFieldPopover(false);
  };

  const performColumnMapping = useCallback(
    (columns, isSingleUpdate = false) => {
      const newColumns = isSingleUpdate
        ? formFields.filter((field) => field.componentId !== columns[0].componentId)
        : [];
      let operations = {
          updated: {},
          added: {},
          deleted: [],
        },
        componentsToBeRemoved = [];

      const isFormRegeneration = isFormGenerated && currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS;

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
        columns.forEach((column) => {
          if (column.isRemoved) {
            componentsToBeRemoved.push(column.componentId);
          }
        });
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
            if (isEqual(column, formFieldsWithComponentDefinition[index])) {
              return newColumns.push(column);
            }
          }

          if (
            currentStatusRef.current === FORM_STATUS.MANAGE_FIELDS &&
            isEqual(column, formFieldsWithComponentDefinition[index])
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
            nextTop = nextTop + added.layouts['desktop'].height + COMPONENT_LAYOUT_DETAILS.spacing;

            // Create simplified column structure with only the required fields
            // This will allow DataSectionUI to use componentId to fetch detailed info from the store
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
          saveDataSection(newColumns);
        }
      }
      closeModal();
    },
    [
      closeModal,
      component.id,
      currentLayout,
      currentStatusRef,
      formFields,
      formFieldsWithComponentDefinition,
      getChildComponents,
      isFormGenerated,
      performBatchComponentOperations,
      saveDataSection,
    ]
  );

  const renderAddCustomFieldButton = () => {
    return (
      <OverlayTrigger
        trigger="click"
        placement="left"
        show={showAddFieldPopover}
        onToggle={(show) => {
          if (!show && shouldPreventPopoverClose) {
            return;
          }
          setShowAddFieldPopover(show);
        }}
        rootClose
        overlay={
          <Popover id="add-field-popover" className="shadow form-fields-column-popover">
            <FieldPopoverContent
              field={undefined}
              onChange={handleAddField}
              onClose={() => setShowAddFieldPopover(false)}
              darkMode={darkMode}
              mode="add"
              onDropdownOpen={handleDropdownOpen}
              onDropdownClose={handleDropdownClose}
              shouldPreventPopoverClose={shouldPreventPopoverClose}
            />
          </Popover>
        }
      >
        <Button ref={addFieldButtonRef} iconOnly leadingIcon="plus" variant="ghost" size="small" />
      </OverlayTrigger>
    );
  };

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  return (
    <>
      <div className="tw-flex tw-justify-center tw-items-center form-generate-form-btn">
        <Button
          fill={buttonDetails.disabled ? '#E4E7EB' : '#4368E3'}
          leadingIcon={currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS ? 'plus' : 'arrowdirectionloop'}
          variant={buttonDetails.disabled ? 'outline' : 'secondary'}
          onClick={openModal}
          disabled={buttonDetails.disabled}
        >
          {buttonDetails.text}
        </Button>
      </div>
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-1.5">
        <div className="tw-flex-1">
          <LabeledDivider label="Fields" />
        </div>
        {renderAddCustomFieldButton()}
      </div>
      <FormFieldsList
        isFormGenerated={isFormGenerated}
        fields={formFieldsWithComponentDefinition} // Use enhanced fields with component data
        onDeleteField={handleDeleteField}
        setIsModalOpen={setIsModalOpen}
        currentStatusRef={currentStatusRef}
        onSave={performColumnMapping}
      />
      {isModalOpen && (
        <ColumnMappingComponent
          isOpen={isModalOpen}
          onClose={closeModal}
          darkMode={darkMode}
          columns={buildColumns()}
          currentStatusRef={currentStatusRef}
          onSubmit={performColumnMapping}
        />
      )}
    </>
  );
};

export default DataSectionUI;
