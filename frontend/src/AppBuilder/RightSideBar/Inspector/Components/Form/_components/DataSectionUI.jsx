import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { LabeledDivider, ColumnMappingComponent, FormFieldsList, FieldPopoverContent } from './index';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDropdownState } from '../_hooks/useDropdownState';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { findNextElementTop, mergeFieldsWithComponentDefinition } from '../utils/utils';
import { createNewComponentFromMeta } from '../utils/fieldOperations';
import { FORM_STATUS, COMPONENT_LAYOUT_DETAILS } from '../constants';
import { checkDiff } from '@/AppBuilder/Widgets/componentUtils';

/* IMPORTANT - mandatory and selected (visibility) properties are objects with value and fxActive 
               This is to support dynamic values and fx expressions in the form fields.
               When using these properties, ensure to access the value like so: field.mandatory.value
               or field.selected.value.
               Rest all the fields are directly accessible as strings or booleans.
               For example: field.label, field.name, field.value, etc.
*/

const DataSectionUI = ({
  component,
  darkMode = false,
  currentStatusRef,
  openModalFromParent = false,
  setParentModalState,
  performColumnMapping,
  newResolvedJsonData,
  existingResolvedJsonData,
  source,
  JSONData,
  isLoading: isDataLoading,
  savedSourceValue = '',
}) => {
  const { getChildComponents, currentLayout, getComponentDefinition, performBatchComponentOperations, saveFormFields } =
    useStore(
      (state) => ({
        getChildComponents: state.getChildComponents,
        currentLayout: state.currentLayout,
        getComponentDefinition: state.getComponentDefinition,
        performBatchComponentOperations: state.performBatchComponentOperations,
        saveFormFields: state.saveFormFields,
      }),
      shallow
    );

  const formFields = useStore((state) => state.getFormFields(component.id), checkDiff);

  const formFieldsWithComponentDefinition = useMemo(
    () => mergeFieldsWithComponentDefinition(formFields, getComponentDefinition),
    [formFields, getComponentDefinition]
  );

  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);
  const addFieldButtonRef = useRef(null);

  const hideManageFields =
    formFields.length === 0 ||
    savedSourceValue === '' ||
    savedSourceValue === 'rawJson' ||
    savedSourceValue === 'jsonSchema' ||
    source?.value === 'rawJson';

  useEffect(() => {
    if (openModalFromParent && openModalFromParent !== isModalOpen) {
      setIsModalOpen(true);
    } else if (!openModalFromParent) setIsModalOpen(false);
  }, [openModalFromParent, isModalOpen]);

  const handleDeleteField = (field) => {
    const updatedFields = formFields.filter((f) => f.componentId !== field.componentId);
    let operations = {
      updated: {},
      added: {},
      deleted: [field.componentId],
    };
    performBatchComponentOperations(operations);
    saveFormFields(component.id, updatedFields, 'canvas');
  };

  const handleAddField = (newField) => {
    const updatedFields = {
      componentType: newField.componentType,
      name: 'custom',
      mandatory: newField.mandatory,
      label: newField.label,
      value: '',
      placeholder: newField.placeholder,
      selected: true,
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
    saveFormFields(component.id, [...formFields, { componentId: added.id, isCustomField: true }], 'canvas');
    setShowAddFieldPopover(false);
  };

  const renderManageFieldsIcon = () => {
    return (
      <Button
        iconOnly
        leadingIcon="sliders"
        variant="ghost"
        size="small"
        onClick={() => {
          currentStatusRef.current = FORM_STATUS.MANAGE_FIELDS;
          setParentModalState(true);
          setIsModalOpen(true);
        }}
      />
    );
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

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setParentModalState(false);
  }, [setIsModalOpen]);

  return (
    <>
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-1.5">
        <div className="tw-flex-1">
          <LabeledDivider label="Fields" rightContentCount={hideManageFields ? 1 : 2} />
        </div>
        <div className="tw-flex tw-items-center">
          {!hideManageFields && renderManageFieldsIcon()}
          {renderAddCustomFieldButton()}
        </div>
      </div>
      <FormFieldsList
        fields={formFieldsWithComponentDefinition}
        onDeleteField={handleDeleteField}
        currentStatusRef={currentStatusRef}
        onSave={performColumnMapping}
      />
      {isModalOpen && (
        <ColumnMappingComponent
          isOpen={isModalOpen}
          onClose={closeModal}
          darkMode={darkMode}
          currentStatusRef={currentStatusRef}
          onSubmit={performColumnMapping}
          // Add new props for buildColumns
          component={component}
          newResolvedJsonData={newResolvedJsonData}
          existingResolvedJsonData={existingResolvedJsonData}
          source={source}
          JSONData={JSONData}
          isDataLoading={isDataLoading}
        />
      )}
    </>
  );
};

export default DataSectionUI;
