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

  // Keyboard support for the option list: the options are custom listbox items,
  // so Enter/Space must select and Arrow keys must move focus — without this a
  // keyboard user can open the menu but never choose a device.
  const handleOptionKeyDown = (event, device) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      handleDeviceSelect(device);
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const options = Array.from(
        event.currentTarget.closest('[role="listbox"]')?.querySelectorAll('[role="option"]') ?? []
      );
      const index = options.indexOf(event.currentTarget);
      if (index === -1) return;
      const next = event.key === 'ArrowDown' ? Math.min(index + 1, options.length - 1) : Math.max(index - 1, 0);
      options[next]?.focus();
    }
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
                    onKeyDown={(event) => handleOptionKeyDown(event, device)}
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
