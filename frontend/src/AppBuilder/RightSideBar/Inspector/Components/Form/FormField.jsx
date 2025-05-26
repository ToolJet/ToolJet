import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import WidgetIcon from '@/../assets/images/icons/widgets';
import FieldPopoverContent from './FieldPopoverContent';
import { useDropdownState } from './hooks/useDropdownState';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { isTrueValue, isPropertyFxControlled, updateFormFieldComponent } from './utils';

export const FormField = ({ field, onDelete, activeMenu, onMenuToggle, darkMode = false }) => {
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const setComponentPropertyByComponentIds = useStore((state) => state.setComponentPropertyByComponentIds, shallow);
  const [showPopover, setShowPopover] = useState(false);
  const [fieldData, setFieldData] = useState(field);
  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();

  // Close main popover when another field's menu opens
  useEffect(() => {
    if (activeMenu && activeMenu !== fieldData.name) {
      setShowPopover(false);
    }
  }, [activeMenu, fieldData.name]);

  useEffect(() => {
    setFieldData(field);
  }, [field]);

  const handleFieldChange = (updatedField) => {
    setFieldData(updatedField);

    // Only update component in the store if we have a componentId
    if (field.componentId) {
      const updatedComponent = updateFormFieldComponent(field.componentId, updatedField, field);
      const components = {
        [field.componentId]: updatedComponent,
      };

      if (updatedComponent) {
        // Update the component in the store
        setComponentPropertyByComponentIds(components);
        setShowPopover(false);
      }
    }
  };

  // Check if mandatory property is fx controlled
  const isMandatoryFxControlled = isPropertyFxControlled(fieldData.mandatory);

  // Determine if the field is currently mandatory
  const isCurrentlyMandatory = isTrueValue(fieldData.mandatory.value);

  const mainPopover = (
    <Popover id="popover-basic" className="shadow form-fields-column-popover">
      <FieldPopoverContent
        field={fieldData}
        mode="edit"
        onClose={() => setShowPopover(false)}
        onChange={handleFieldChange}
        onDropdownOpen={handleDropdownOpen}
        onDropdownClose={handleDropdownClose}
        shouldPreventPopoverClose={shouldPreventPopoverClose}
      />
    </Popover>
  );

  const menuPopover = (
    <Popover id="menu-popover" className="shadow">
      <Popover.Body className="tw-p-2">
        <div className="tw-flex tw-flex-col">
          <Button
            variant="ghost"
            size="default"
            onClick={() => {
              // Toggle mandatory status if not fx controlled
              const newValue = !isCurrentlyMandatory;
              handleFieldChange({
                ...fieldData,
                mandatory:
                  typeof fieldData.mandatory === 'object'
                    ? { ...fieldData.mandatory, value: `{{${newValue}}}` }
                    : `{{${newValue}}}`,
              });
              onMenuToggle(null);
            }}
            disabled={isMandatoryFxControlled} // Disable button if mandatory is fx controlled
            className={`base-regular ${isMandatoryFxControlled ? 'tw-opacity-50' : ''}`}
            leadingIcon="asterix"
            fill="#CCD1D5"
          >
            {isCurrentlyMandatory ? 'Make optional' : 'Make mandatory'}
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => {
              onMenuToggle(null);
              setSelectedComponents([field.componentId]);
            }}
            className="base-regular"
            leadingIcon="inspect"
            fill="#CCD1D5"
          >
            View properties and styles
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing the main popover
              onDelete(fieldData);
              onMenuToggle(null);
            }}
            className="base-regular"
            leadingIcon="remove"
            fill="#CCD1D5"
          >
            Remove from form
          </Button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="tw-relative tw-group">
      <OverlayTrigger
        trigger="click"
        placement="left"
        show={showPopover}
        onToggle={(show) => {
          if (!show && shouldPreventPopoverClose) {
            return; // Prevent closing when dropdown is being interacted with or just closed
          }
          if (show) onMenuToggle(null);
          setShowPopover(show);
        }}
        rootClose
        overlay={mainPopover}
      >
        <div className="field-item tw-flex tw-items-center tw-justify-between tw-gap-2 hover:tw-cursor-pointer">
          <div className="tw-flex tw-items-center tw-gap-[6px] tw-flex-1" style={{ width: 'calc(100% - 100px)' }}>
            <div className="field-icon tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-rounded tw-bg-gray-100">
              <WidgetIcon name={'textinput'} fill={darkMode ? '#3A3F42' : '#D7DBDF'} width="16" />
            </div>
            <span className="field-name tw-text-sm base-regular">{fieldData.name}</span>
          </div>

          <OverlayTrigger
            trigger="click"
            placement="bottom-start"
            show={activeMenu === fieldData.name}
            onToggle={(show) => {
              setShowPopover(false); // Always close main popover when clicking three dots
              if (show) {
                onMenuToggle(fieldData.name);
              } else {
                onMenuToggle(null);
              }
            }}
            rootClose
            overlay={menuPopover}
          >
            <Button
              iconOnly
              leadingIcon="morevertical"
              variant="ghost"
              size="default"
              className="tw-opacity-0 group-hover:tw-opacity-100 more-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </OverlayTrigger>
        </div>
      </OverlayTrigger>
    </div>
  );
};
