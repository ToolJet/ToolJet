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
import { parseData, findLastElementPosition, createFormFieldComponents, updateFormFieldComponent } from './utils';

/* IMPORTANT - mandatory and selected (visibility) properties are objects with value and fxActive 
               This is to support dynamic values and fx expressions in the form fields.
               When using these properties, ensure to access the value like so: field.mandatory.value
               or field.selected.value.
               Rest all the fields are directly accessible as strings or booleans.
               For example: field.label, field.name, field.value, etc.
*/

/**
 * Retrieves field data from a component definition in the store
 * @param {string} componentId - Component ID to fetch definition for
 * @param {Function} getComponentDefinition - Function to get component definition
 * @returns {Object} Field data with merged component definition values
 */
const getFieldDataFromComponent = (componentId, getComponentDefinition) => {
  if (!componentId) {
    return null;
  }

  const component = getComponentDefinition(componentId);
  if (!component) return null;

  const componentType = component.component.component;
  const definition = component.component.definition;

  // Get values from component definition
  const label = definition.properties?.label?.value || '';
  const name = component.component.name;

  // Different components store values in different properties
  let value;
  if (componentType === 'Checkbox' || componentType === 'DatePickerV2') {
    value = definition.properties?.defaultValue?.value;
  } else {
    value = definition.properties?.value?.value;
  }

  const mandatory = definition.validation?.mandatory;
  const selected = definition.properties?.visibility;
  const placeholder = definition.properties?.placeholder?.value || '';

  return {
    label,
    name,
    value,
    mandatory,
    selected,
    placeholder,
    componentType,
  };
};

const DataSectionUI = ({ component, paramUpdated, darkMode = false }) => {
  const {
    resolveReferences,
    getChildComponents,
    currentLayout,
    deleteComponents,
    addComponentToCurrentPage,
    getComponentDefinition,
    setComponentPropertyByComponentIds,
  } = useStore(
    (state) => ({
      resolveReferences: state.resolveReferences,
      getChildComponents: state.getChildComponents,
      currentLayout: state.currentLayout,
      deleteComponents: state.deleteComponents,
      addComponentToCurrentPage: state.addComponentToCurrentPage,
      getComponentDefinition: state.getComponentDefinition,
      setComponentPropertyByComponentIds: state.setComponentPropertyByComponentIds,
    }),
    shallow
  );

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
  const [fields, setFields] = useState(isFormGenerated ? generatedFields : formattedJson || []);

  // Enhance fields with component definition data when needed for UI rendering
  const enhancedFields = fields.map((field) => {
    if (field.componentId) {
      const componentData = getFieldDataFromComponent(field.componentId, getComponentDefinition);

      return {
        ...field,
        // Merge component definition data for UI rendering
        label: componentData?.label || field.label || '',
        name: componentData?.name || field.name || '',
        value: componentData?.value || field.value || '',
        mandatory: componentData?.mandatory || field.mandatory || false,
        selected: componentData?.selected || field.selected || false,
        placeholder: componentData?.placeholder || field.placeholder || '',
        componentType: componentData?.componentType || field.componentType || 'TextInput',
      };
    }
    return field;
  });

  useEffect(() => {
    if (isFormGenerated) {
      setFields(generatedFields);
    } else if (formattedJson) {
      setFields(formattedJson);
    }
  }, [JSON.stringify(formattedJson), JSON.stringify(generatedFields), isFormGenerated]);

  const handleDeleteField = (field) => {
    const updatedFields = fields.filter((f) => f.componentId !== field.componentId);
    deleteComponents([field.componentId]);
    paramUpdated({ name: 'fields' }, 'value', updatedFields, 'properties');
  };

  // Function to create a single custom field and update the fields property
  const createComponentAndUpdateFields = async (columns, isSingleField = false) => {
    if (isFormGenerated) {
      let diff = {};
      columns.forEach((column) => {
        const updatedField = updateFormFieldComponent(
          column.componentId,
          column,
          fields.find((f) => f.componentId === column.componentId)
        );
        if (Object.keys(updatedField).length !== 0) {
          diff[column.componentId] = updatedField;
        }
      });
      if (diff) {
        // Update the component properties in the store
        setComponentPropertyByComponentIds(diff);
      }
    } else {
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
        if (isSingleField) {
          paramUpdated({ name: 'fields' }, 'value', [...fields, ...updatedColumns], 'properties');
        } else {
          paramUpdated({ name: 'fields' }, 'value', updatedColumns, 'properties');
        }
      }
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
    createComponentAndUpdateFields([updatedFields], true);
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

      <FormFieldsList
        isFormGenerated={isFormGenerated}
        fields={enhancedFields} // Use enhanced fields with component data
        onDeleteField={handleDeleteField}
        setIsModalOpen={setIsModalOpen}
      />

      {isModalOpen && (
        <ColumnMappingComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          darkMode={darkMode}
          columns={enhancedFields} // Use enhanced fields with component data
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
