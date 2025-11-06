import React, { memo } from 'react';
import { IconMicrophoneOff, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';

function RecorderActionIcon({ permissionState, status, isPlaying, IconElement }) {
  if (permissionState === 'denied') {
    return <IconMicrophoneOff width={14} height={14} color="var(--cc-default-icon)" />;
  }
  if (status === 'idle' || status === 'paused') {
    return <IconElement width={14} height={14} color="#F6430D" />;
  }
  if (status === 'recording') {
    return <IconPlayerPause width={14} height={14} color="var(--icon-strong)" />;
  }
  if (status === 'stopped') {
    return isPlaying ? (
      <IconPlayerPause width={14} height={14} color="var(--icon-strong)" />
    ) : (
      <IconPlayerPlay width={14} height={14} color="var(--icon-strong)" />
    );
  }
  return <IconElement width={14} height={14} color="#F6430D" />;
}

export default memo(RecorderActionIcon);
