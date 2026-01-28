import React, { memo } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { IconCheck, IconX, IconTrash } from '@tabler/icons-react';

function RecorderActions({ status, permissionState, onSave, onReset, openMicPermissionsHelp, accentColor }) {
  if (status === 'paused') {
    return (
      <>
        <ButtonSolid
          variant="primary"
          className="audio-recorder-button audio-recorder-save-button"
          size="md"
          onClick={onSave}
        >
          <IconCheck width={14} height={14} color="var(--icon-on-solid)" />
        </ButtonSolid>
        <ButtonSolid variant="tertiary" className="audio-recorder-button" size="md" onClick={onReset}>
          <IconX width={14} height={14} color="var(--icon-strong)" />
        </ButtonSolid>
      </>
    );
  }
  if (status === 'stopped') {
    return (
      <ButtonSolid
        variant="tertiary"
        className="audio-recorder-button audio-recorder-tertiary-button"
        size="md"
        onClick={onReset}
      >
        <IconTrash width={14} height={14} color="var(--icon-strong)" />
      </ButtonSolid>
    );
  }
  if (permissionState === 'denied') {
    return (
      <span className="permission-denied-text" style={{ color: accentColor }} onClick={openMicPermissionsHelp}>
        Know more
      </span>
    );
  }
  return null;
}

export default memo(RecorderActions);
