import React, { memo } from 'react';
import RecordTimer from './RecordTimer';

function RecorderStatusDisplay({ permissionState, status, isPlaying, playTimerKey, label }) {
  if (permissionState === 'denied') {
    return 'Microphone permission denied';
  }
  if (['recording', 'paused', 'stopping', 'stopped'].includes(status)) {
    return (
      <div className="audio-recorder-timer-container">
        {status === 'stopped' && (
          <>
            <RecordTimer isRunning={isPlaying} key={playTimerKey} />
            <span>/</span>
          </>
        )}
        <RecordTimer isRunning={status === 'recording'} />
      </div>
    );
  }
  return label;
}

export default memo(RecorderStatusDisplay);
