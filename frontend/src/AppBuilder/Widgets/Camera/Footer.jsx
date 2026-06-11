import React from 'react';
import { DeviceSelect } from './DeviceSelect';
import {
  IconPlayerRecordFilled,
  IconArrowsMaximize,
  IconCamera,
  IconArrowsMinimize,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import cx from 'classnames';

export const Footer = ({
  cameraDevices = [],
  microphoneDevices = [],
  selectedCameraId,
  selectedMicrophoneId,
  onCameraSelect,
  onMicrophoneSelect,
  onCaptureToggle,
  recordingStatus,
  captureDisabled,
  deviceSelectDisabled,
  onFullscreenToggle,
  fullscreenDisabled,
  isFullscreen,
  recorderError,
  permissionError,
  contentType,
  hasPendingCapture,
  accentColor,
}) => {
  const isRecording = recordingStatus === 'recording';
  const hasRecordingStopped = recordingStatus === 'stopped';
  const showSaveDiscard = hasRecordingStopped || hasPendingCapture;
  const captureLabel = contentType === 'video' ? (isRecording ? 'Stop recording' : 'Start recording') : 'Capture photo';
  const captureIconColor = isRecording ? '#F6430D' : '#FFFFFF';
  const fullscreenLabel = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  const errorMessage = recorderError || permissionError;
  const FullscreenIcon = isFullscreen ? IconArrowsMinimize : IconArrowsMaximize;
  const captureTitle = contentType === 'video' && errorMessage ? errorMessage : captureLabel;
  return (
    <div className="camera-footer">
      <div className="camera-microphone-select">
        <DeviceSelect
          icon="video"
          devices={cameraDevices}
          selectedDeviceId={selectedCameraId}
          onSelect={onCameraSelect}
          disabled={deviceSelectDisabled}
          accentColor={accentColor}
        />
        {contentType === 'video' && (
          <DeviceSelect
            icon="microphone"
            devices={microphoneDevices}
            selectedDeviceId={selectedMicrophoneId}
            onSelect={onMicrophoneSelect}
            disabled={deviceSelectDisabled}
            accentColor={accentColor}
          />
        )}
      </div>
      {showSaveDiscard ? (
        <div className="camera-save-discard-container">
          <ButtonSolid variant="primary" className="camera-save-button" size="md" onClick={() => onCaptureToggle(true)}>
            <IconCheck width={14} height={14} color="var(--icon-on-solid)" />
          </ButtonSolid>
          <ButtonSolid
            variant="tertiary"
            className="camera-discard-button camera-transparent-button"
            size="md"
            onClick={() => onCaptureToggle(false)}
          >
            <IconX width={14} height={14} color="var(--icon-strong)" />
          </ButtonSolid>
        </div>
      ) : (
        <div className="camera-capture-button">
          <ButtonSolid
            variant="tertiary"
            className={cx('camera-capture-button-trigger camera-transparent-button', {
              'camera-capture-button-trigger-default': !isRecording && contentType === 'video',
            })}
            onClick={onCaptureToggle}
            disabled={captureDisabled}
            aria-label={captureLabel}
            title={captureTitle}
          >
            {contentType === 'video' ? (
              <IconPlayerRecordFilled
                width={16}
                height={16}
                color={captureIconColor}
                style={{ color: captureIconColor }}
              />
            ) : (
              <IconCamera width={16} height={16} color="var(--icon-default)" />
            )}
          </ButtonSolid>
        </div>
      )}
      <div className="camera-fullscreen-button">
        <ButtonSolid
          variant="ghostBlack"
          className="camera-fullscreen-button-trigger"
          onClick={onFullscreenToggle}
          disabled={fullscreenDisabled}
          aria-label={fullscreenLabel}
          title={fullscreenLabel}
        >
          <FullscreenIcon width={16} height={16} color="var(--icon-default)" />
        </ButtonSolid>
      </div>
    </div>
  );
};
