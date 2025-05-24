import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import LabeledDivider from './LabeledDivider';
import ColumnMappingComponent from './ColumnMappingComponent';
import { FormFieldsList } from './FormFieldsList';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import FieldPopoverContent from './FieldPopoverContent';
import { useDropdownState } from './hooks/useDropdownState';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { parseData, findLastElementPosition, createFormFieldComponents } from './utils';

const DataSectionUI = ({ component, paramUpdated, darkMode = false }) => {
  const resolveReferences = useStore((state) => state.resolveReferences, shallow);
  const getChildComponents = useStore((state) => state.getChildComponents, shallow);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const addComponentToCurrentPage = useStore((state) => state.addComponentToCurrentPage, shallow);
  const generateFormFrom = component.component.definition.properties['generateFormFrom'] || null;
  const generatedFields = component.component.definition.properties['fields']?.value || [];
  const isFormGenerated = generatedFields.length > 0;

  let jsonData = null,
    formattedJson = null;

  if (generateFormFrom?.value === 'rawJson') {
    jsonData = component.component.definition.properties['rawJsonData']?.value;
    const resolvedJsonData = resolveReferences('canvas', jsonData);
    if (resolvedJsonData) {
      try {
        formattedJson = parseData(resolvedJsonData);
      } catch (e) {
        console.error('Error parsing JSON data:', e);
      }
    }
  }

  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddFieldPopover, setShowAddFieldPopover] = useState(false);
  const addFieldButtonRef = useRef(null);
  const [fields, setFields] = useState(formattedJson || []);

  useEffect(() => {
    if (formattedJson) {
      setFields(formattedJson);
    }
  }, [JSON.stringify(formattedJson)]);

  const handleDeleteField = (index) => {
    setFields((prevFields) => prevFields.filter((_, i) => i !== index));
  };

  const createComponentAndUpdateFields = async (columns) => {
    const childComponents = getChildComponents(component?.id);
    if (childComponents) {
      // Get the last position of the child components
      const lastPosition = findLastElementPosition(childComponents, currentLayout);
      // Create form field components from columns
      const { updatedColumns, formFields } = createFormFieldComponents(
        columns,
        component.id,
        currentLayout,
        lastPosition
      );

      // Add the components to the canvas
      if (formFields.length > 0) {
        await addComponentToCurrentPage(formFields);
      }
      // Update the form fields property
      paramUpdated({ name: 'fields' }, 'value', updatedColumns, 'properties');
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
      selected: `{{true}}`,
      isCustomField: true,
    };
    createComponentAndUpdateFields([updatedFields]);
    // Close the popover after adding the field
    setShowAddFieldPopover(false);
  };

  const renderRefreshButton = () => (
    <div className="tw-flex tw-justify-center tw-items-center">
      <Button
        fill={'#ACB2B9'}
        leadingIcon="arrowdirectionloop"
        variant={'outline'}
        onClick={() => setIsModalOpen(true)}
      >
        Refresh data
      </Button>
    </div>
  );

  const renderRefreshDataSection = () => {
    return (
      <div className="tw-p-3 tw-flex tw-flex-col tw-gap-3 refresh-data-section">
        <div className="tw-flex tw-items-center tw-gap-[6px]">
          <SolidIcon name="warning" width="18px" height="18px" fill="#4368E3" />
          <span className="base-medium neutral-light-color">Json has been updated</span>
        </div>
        <Button
          fill="#4368E3"
          leadingIcon="arrowdirectionloop"
          variant="secondary"
          className="refresh-data-button tw-my-2"
        >
          Refresh form data
        </Button>
      </div>
    );
  };

  const renderCustomSchemaSection = () => {
    return (
      <div className="tw-p-3 tw-flex tw-flex-col tw-gap-3 custom-schema-fields-section">
        <div className="tw-flex tw-items-center tw-gap-[6px]">
          <SolidIcon name="warning" width="18px" height="18px" fill="#BF4F03" />
          <span className="base-medium neutral-light-color">Custom fields can’t be added</span>
        </div>
      </div>
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

  return (
    <>
      {isFormGenerated ? (
        <>
          {renderRefreshButton()}
          {renderRefreshDataSection()}
          {renderCustomSchemaSection()}
        </>
      ) : (
        <div className="tw-flex tw-justify-center tw-items-center form-generate-form-btn">
          <Button
            fill={generateFormFrom === null ? '#E4E7EB' : '#4368E3'}
            leadingIcon="plus"
            variant={generateFormFrom === null ? 'outline' : 'secondary'}
            onClick={() => setIsModalOpen(true)}
            disabled={generateFormFrom === null}
          >
            Generate form
          </Button>
        </div>
      )}
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-1.5">
        <div className="tw-flex-1">
          <LabeledDivider label="Fields" isFormGenerated={isFormGenerated} />
        </div>
        {isFormGenerated && renderAddCustomFieldButton()}
      </div>

      <FormFieldsList fields={generatedFields} onDeleteField={handleDeleteField} setIsModalOpen={setIsModalOpen} />

      {isModalOpen && (
        <ColumnMappingComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          darkMode={darkMode}
          columns={fields}
          mode="mapping"
          title="Map columns"
          isFormGenerated={isFormGenerated}
          onSubmit={(columns) => {
            try {
              createComponentAndUpdateFields(columns);
            } catch (error) {
              console.error('Error processing form fields:', error);
            }

            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default DataSectionUI;
