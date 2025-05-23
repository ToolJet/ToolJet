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
import { parseData } from './utils';

const DataSectionUI = ({ component, darkMode = false }) => {
  const resolveReferences = useStore((state) => state.resolveReferences);
  const generateFormFrom = component.component.definition.properties['generateFormFrom'] || null;
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

  const handleAddField = (newField) => {
    setFields((prevFields) => [
      ...prevFields,
      {
        name: newField.label || 'New Field',
        dataType: 'string',
        inputType: newField.type || 'text',
        mandatory: false,
        label: newField.label || 'New Field',
        selected: true,
      },
    ]);
    setShowAddFieldPopover(false);
  };

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
  return (
    <>
      <div className="tw-flex tw-justify-center tw-items-center">
        <Button fill="#4368E3" leadingIcon="plus" variant="secondary" onClick={() => setIsModalOpen(true)}>
          Generate form
        </Button>
      </div>
      {renderRefreshDataSection()}
      {renderCustomSchemaSection()}
      <div className="tw-flex tw-justify-between tw-items-center tw-gap-1.5">
        <div className="tw-flex-1">
          <LabeledDivider label="Fields" />
        </div>
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
                field={{}}
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
      </div>

      <FormFieldsList fields={fields} onDeleteField={handleDeleteField} />

      <div className="tw-flex tw-justify-center tw-items-center tw-mt-3">
        <Button fill="#ACB2B9" leadingIcon="sliders" variant="outline" onClick={() => setIsModalOpen(true)}>
          Manage fields
        </Button>
      </div>

      <ColumnMappingComponent
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        darkMode={darkMode}
        columns={fields}
        mode="mapping"
        title="Map columns"
        onSubmit={(selectedFields) => {
          setFields(selectedFields);
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default DataSectionUI;
