import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import WidgetIcon from '@/../assets/images/icons/widgets';
import FieldPopoverContent from './FieldPopoverContent';
import { useDropdownState } from './hooks/useDropdownState';

export const FormField = ({ name, type, onDelete, activeMenu, onMenuToggle, darkMode = false }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [fieldData, setFieldData] = useState({ name, type });
  const { handleDropdownOpen, handleDropdownClose, shouldPreventPopoverClose } = useDropdownState();

  // Close main popover when another field's menu opens
  useEffect(() => {
    if (activeMenu && activeMenu !== fieldData.name) {
      setShowPopover(false);
    }
  }, [activeMenu, fieldData.name]);

  const handleFieldChange = (changes) => {
    setFieldData((prev) => ({ ...prev, ...changes }));
  };

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
              handleFieldChange({ ...fieldData, required: true });
              onMenuToggle(null);
            }}
            className="base-regular"
            leadingIcon="asterix"
            fill="#CCD1D5"
          >
            Make mandatory
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => {
              onMenuToggle(null);
              setTimeout(() => setShowPopover(true), 100);
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
            onClick={() => {
              onDelete?.();
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
