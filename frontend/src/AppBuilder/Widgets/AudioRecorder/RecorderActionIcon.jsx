import React, { memo } from 'react';
import { IconMicrophoneOff, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';

function RecorderActionIcon({ permissionState, status, isPlaying, IconElement, recorderIconColor }) {
  if (permissionState === 'denied') {
    return <IconMicrophoneOff width={14} height={14} color="var(--cc-default-icon)" />;
  }

  switch (status) {
    case 'idle':
    case 'paused':
      return IconElement ? <IconElement width={14} height={14} color={recorderIconColor} /> : null;
    case 'recording':
      return <IconPlayerPause width={14} height={14} color="var(--icon-strong)" />;
    case 'stopped':
      return isPlaying ? (
        <IconPlayerPause width={14} height={14} color="var(--icon-strong)" />
      ) : (
        <IconPlayerPlay width={14} height={14} color="var(--icon-strong)" />
      );
    default:
      return IconElement ? <IconElement width={14} height={14} color={recorderIconColor} /> : null;
  }
}

export default memo(RecorderActionIcon);
