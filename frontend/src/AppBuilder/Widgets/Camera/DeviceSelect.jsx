import React, { useEffect, useState } from 'react';
import { IconVideo, IconChevronDown, IconMicrophone } from '@tabler/icons-react';
import CheckIcon from '@/components/ui/Checkbox/CheckboxUtils/CheckIcon';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';

export const DeviceSelect = ({
  icon = 'video',
  devices = [],
  selectedDeviceId,
  onSelect,
  disabled = false,
  accentColor,
}) => {
  const [open, setOpen] = useState(false);

  const IconElement = icon === 'video' ? IconVideo : IconMicrophone;
  const hasDevices = Array.isArray(devices) && devices.length > 0;
  const emptyLabel = icon === 'microphone' ? 'No microphones found' : 'No cameras found';
  const triggerLabel = icon === 'microphone' ? 'Select microphone device' : 'Select camera device';
  const isTriggerDisabled = disabled || !hasDevices;

  const handleDeviceSelect = (device) => {
    onSelect?.(device.value);
  };

  useEffect(() => {
    if (isTriggerDisabled && open) {
      setOpen(false);
    }
  }, [isTriggerDisabled, open]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isTriggerDisabled) return;
        setOpen(nextOpen);
      }}
    >
      <Popover.Trigger
        className="tj-base-btn tj-small-btn tj-tertiary-btn camera-device-select camera-transparent-button"
        aria-label={triggerLabel}
        type="button"
        disabled={isTriggerDisabled}
      >
        <IconElement height={16} width={16} />
        <IconChevronDown height={16} width={16} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="camera-device-popover-content" sideOffset={4} collisionPadding={8} align="start">
          <div className="camera-device-list" role="listbox">
            {hasDevices ? (
              devices.map((device) => {
                const isSelected = selectedDeviceId === device.value;
                return (
                  <div
                    key={device.id}
                    className={`camera-device-item ${isSelected ? 'selected' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      handleDeviceSelect(device);
                      setOpen(false);
                    }}
                    style={{
                      '--camera-accent-color': accentColor,
                    }}
                    tabIndex={0}
                  >
                    <span className="camera-device-item-check">
                      {isSelected && <CheckIcon size="large" fill={accentColor} />}
                    </span>
                    <span className="camera-device-item-label">{device.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="camera-device-empty" role="status">
                {emptyLabel}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
