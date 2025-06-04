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
import { updateFormFieldComponent } from './utils/fieldOperations';
import { merge } from 'lodash';
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
    deleteComponents,
    addComponentToCurrentPage,
    getComponentDefinition,
    performBatchComponentOperations,
    getFormFields,
    setFormFields,
    getFormDataSectionData,
  } = useStore(
    (state) => ({
      resolveReferences: state.resolveReferences,
      getChildComponents: state.getChildComponents,
      currentLayout: state.currentLayout,
      deleteComponents: state.deleteComponents,
      addComponentToCurrentPage: state.addComponentToCurrentPage,
      getComponentDefinition: state.getComponentDefinition,
      performBatchComponentOperations: state.performBatchComponentOperations,
      getFormFields: state.getFormFields,
      setFormFields: state.setFormFields,
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
    formattedJson = [],
    existingResolvedJsonData = existingData?.JSONData?.value;

  JSONData = component.component.definition.properties['JSONData']?.value;
  const newResolvedJsonData = resolveReferences('canvas', JSONData);
  if (existingData?.generateFormFrom?.value === 'rawJson')
    existingResolvedJsonData = resolveReferences('canvas', existingResolvedJsonData);

  if (newResolvedJsonData) {
    try {
      // Analyze differences between the current JSON data and the existing data
      const jsonDifferences = analyzeJsonDifferences(newResolvedJsonData, existingResolvedJsonData);
      formattedJson = parseDataAndBuildFields({ ...existingResolvedJsonData, ...newResolvedJsonData }, jsonDifferences);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
    }
  }

  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);
  const addFieldButtonRef = useRef(null);
  const [fields, setFields] = useState(isFormGenerated ? formFields : formattedJson || []);

  useEffect(() => {
    if (isFormGenerated) {
      setFields(formFields);
    } else if (formattedJson) {
      setFields(formattedJson);
    }
  }, [JSON.stringify(formattedJson), JSON.stringify(formFields), isFormGenerated]);

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
    const jsonDifferences = analyzeJsonDifferences(newResolvedJsonData, existingResolvedJsonData);
    return parseDataAndBuildFields(newResolvedJsonData, jsonDifferences);
  };

  const handleDeleteField = (field) => {
    const updatedFields = formFieldsWithComponentDefinition.filter((f) => f.componentId !== field.componentId);
    deleteComponents([field.componentId], 'canvas', {
      skipUndoRedo: false,
      saveAfterAction: true,
      skipFormUpdate: true,
    });
    setFormFields(component.id, updatedFields);
  };

  const createComponentsFromColumns = useCallback(
    (columns, isSingleField = false) => {
      let operations = {
        updated: {},
        added: {},
        deleted: [],
      };
      const childComponents = getChildComponents(component?.id);
      // Get the last position of the child components
      const nextElementsTop = findNextElementTop(childComponents, currentLayout);
      // Create form field components from columns

      if (columns && Array.isArray(columns) && columns.length > 0) {
        const formFieldComponents = [];
        let nextTop = nextElementsTop + COMPONENT_LAYOUT_DETAILS.spacing;

        columns.forEach((column, index) => {
          const { added, updated, deleted } = updateFormFieldComponent(column, {}, component.id, nextTop);
          nextTop = nextTop + added.layouts['desktop'].height + COMPONENT_LAYOUT_DETAILS.spacing;

          formFieldComponents.push(added);

          // Create simplified column structure with only the required fields
          // This will allow DataSectionUI to use componentId to fetch detailed info from the store
          const simplifiedColumn = {
            componentId: added.id,
            isCustomField: column.isCustomField ?? false,
            dataType: column.dataType,
            key: column.key || column.name,
          };

          columns[index] = simplifiedColumn; // Replace with simplified structure

          if (Object.keys(updated).length !== 0) {
            operations.updated[added.id] = updated;
          }
          if (Object.keys(added).length !== 0) {
            operations.added[added.id] = added;
          }
          if (deleted) {
            operations.deleted.push(added.id);
          }
        });
        // const { updatedColumns, updatedFormFields } = createFormFieldComponents(
        //   columns,
        //   component.id,
        //   nextElementsTop
        // );

        // // Add the components to the canvas
        // if (updatedFormFields.length > 0) {
        //   addComponentToCurrentPage(updatedFormFields, 'canvas', {
        //     skipUndoRedo: false,
        //     saveAfterAction: true,
        //     skipFormUpdate: true,
        //   });
        // }

        console.log('here--- operations--- ', operations);

        if (
          Object.keys(operations.updated).length > 0 ||
          Object.keys(operations.added).length > 0 ||
          operations.deleted.length > 0
        ) {
          // Update the component properties in the store
          // setComponentPropertyByComponentIds(operations);
          performBatchComponentOperations(operations);
          saveDataSection(isSingleField ? [...formFields, ...columns] : columns);
        }
      }
      closeModal();
    },
    [
      closeModal,
      component.id,
      currentLayout,
      formFields,
      getChildComponents,
      performBatchComponentOperations,
      saveDataSection,
    ]
  );

  // Function to create a single custom field and update the fields property
  const createComponentAndUpdateFields = (columns) => {
    let operations = {
      updated: {},
      added: {},
      deleted: [],
    };
    columns.forEach((column) => {
      const {
        updated,
        added = {},
        deleted = false,
      } = updateFormFieldComponent(
        column,
        fields.find((f) => f.componentId === column.componentId),
        component.id
      );

      if (Object.keys(updated).length !== 0) {
        operations.updated[column.componentId] = updated;
      }
      if (Object.keys(added).length !== 0) {
        operations.added[column.componentId] = added;
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
      // Update the component properties in the store
      // setComponentPropertyByComponentIds(operations);
      performBatchComponentOperations(operations);
      saveDataSection(columns);
    }
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
    createComponentsFromColumns([updatedFields], true);
    // Close the popover after adding the field
    setShowAddFieldPopover(false);
  };

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
          <LabeledDivider label="Fields" isFormGenerated={isFormGenerated} />
        </div>
        {isFormGenerated && renderAddCustomFieldButton()}
      </div>
      <FormFieldsList
        isFormGenerated={isFormGenerated}
        fields={formFieldsWithComponentDefinition} // Use enhanced fields with component data
        onDeleteField={handleDeleteField}
        setIsModalOpen={setIsModalOpen}
        currentStatusRef={currentStatusRef}
      />
      {isModalOpen && (
        <ColumnMappingComponent
          isOpen={isModalOpen}
          onClose={closeModal}
          darkMode={darkMode}
          columns={buildColumns()}
          isFormGenerated={isFormGenerated}
          onSubmit={createComponentsFromColumns}
        />
      )}
    </>
  );
};

export default DataSectionUI;
