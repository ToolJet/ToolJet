import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FieldPopoverContent } from './index';
import { useDropdownState } from '../_hooks/useDropdownState';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { isTrueValue, isPropertyFxControlled, getComponentIcon } from '../utils/utils';

export const FormField = ({ field, onDelete, activeMenu, onMenuToggle, onSave, darkMode = false }) => {
  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
  const [showPopover, setShowPopover] = useState(false);
  const [fieldData, setFieldData] = useState(field);
  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();

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
    onSave([updatedField], true);
  };

  const isMandatoryFxControlled = isPropertyFxControlled(fieldData.mandatory);

  const isCurrentlyMandatory = isTrueValue(fieldData.mandatory?.value);

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
        setSelectedComponents={setSelectedComponents}
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
            onClick={(e) => {
              e.stopPropagation();
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
            disabled={isMandatoryFxControlled}
            className={`base-regular ${isMandatoryFxControlled ? 'tw-opacity-50' : ''}`}
            leadingIcon="asterix"
            fill="#CCD1D5"
          >
            {isCurrentlyMandatory ? 'Make optional' : 'Make mandatory'}
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
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
              e.stopPropagation();
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
            return;
          }
          if (show) onMenuToggle(null);
          setShowPopover(show);
        }}
        rootClose
        overlay={mainPopover}
      >
        <div
          className={`field-item tw-flex tw-items-center tw-justify-between tw-gap-2 hover:tw-cursor-pointer ${
            (fieldData.name === activeMenu || showPopover) && 'selected'
          }`}
        >
          <div className="tw-flex tw-items-center tw-gap-[6px] tw-flex-1" style={{ width: 'calc(100% - 100px)' }}>
            <div className="field-icon tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-rounded tw-bg-gray-100">
              {getComponentIcon(fieldData.componentType, darkMode)}
            </div>
            <span className="field-name tw-text-sm base-regular">{fieldData.name}</span>
          </div>

          <OverlayTrigger
            trigger="click"
            placement="bottom-start"
            show={activeMenu === fieldData.name}
            onToggle={(show) => {
              setShowPopover(false);
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
