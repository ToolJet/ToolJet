import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { IconMicrophoneOff, IconPlayerPause, IconPlayerPlay, IconCheck, IconX, IconTrash } from '@tabler/icons-react';
import './audioRecorder.scss';
import RecordTimer from './RecordTimer';
import { blobToDataURL, blobToBinary } from './utils';
import * as Icons from '@tabler/icons-react';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import Loader from '@/ToolJetUI/Loader/Loader';

export const AudioRecorder = ({ styles, properties, fireEvent, setExposedVariable, setExposedVariables, dataCy }) => {
  const { recorderIcon, labelColor, accentColor, backgroundColor, borderColor, borderRadius, boxShadow } = styles;
  const { label, loadingState, disabledState, visibility } = properties;

  const [isPlaying, setIsPlaying] = useState(false);
  const [playTimerKey, setPlayTimerKey] = useState(0);
  const [permissionState, setPermissionState] = useState('granted');
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
  });

  const audioRef = useRef(null);
  const endedListenerRef = useRef(null);

  const { status, startRecording, stopRecording, pauseRecording, resumeRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      audio: true,
      onStop: async (blobURL, blob) => {
        const dataURL = await blobToDataURL(blob);
        const rawBinary = await blobToBinary(blob);
        setExposedVariables({
          blobURL,
          dataURL,
          rawBinary,
        });
        fireEvent('onRecordingStop');
      },
    });

  // eslint-disable-next-line import/namespace
  const IconElement = Icons[recorderIcon] == undefined ? Icons['IconMicrophone'] : Icons[recorderIcon];

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const onClick = async () => {
    if (status === 'idle') {
      startRecording();
      fireEvent('onRecordingStart');
    } else if (status === 'recording') {
      pauseRecording();
    } else if (status === 'paused') {
      resumeRecording();
    } else if (status === 'stopped') {
      if (isPlaying) {
        onPause();
        return;
      }
      onPlay();
    }
  };

  const onPlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(mediaBlobUrl);
    }
    audioRef.current.play();
    setIsPlaying(true);

    // Ensure we do not attach multiple listeners across plays
    if (endedListenerRef.current) {
      audioRef.current.removeEventListener('ended', endedListenerRef.current);
    }
    const onEnded = () => {
      setIsPlaying(false);
      setPlayTimerKey((prev) => prev + 1);
    };
    endedListenerRef.current = onEnded;
    audioRef.current.addEventListener('ended', onEnded);
  };

  const onPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const onSave = () => {
    stopRecording();
  };

  const onReset = () => {
    clearBlobUrl();
    setExposedVariables({
      blobURL: null,
      dataURL: null,
      rawBinary: null,
    });
    if (audioRef.current) {
      audioRef.current.pause();
      if (endedListenerRef.current) {
        audioRef.current.removeEventListener('ended', endedListenerRef.current);
        endedListenerRef.current = null;
      }
    }
    audioRef.current = null;
    setIsPlaying(false);
  };

  const ButtonIcon = useMemo(() => {
    if (permissionState === 'denied') {
      return <IconMicrophoneOff width={14} height={14} color="var(--cc-default-icon)" />;
    } else if (status === 'idle' || status === 'paused') {
      return <IconElement width={14} height={14} color="#F6430D" />;
    } else if (status === 'recording') {
      return <IconPlayerPause width={14} height={14} color="var(--icon-strong)" />;
    } else if (status === 'stopped') {
      return isPlaying ? (
        <IconPlayerPause width={14} height={14} color="var(--icon-strong)" />
      ) : (
        <IconPlayerPlay width={14} height={14} color="var(--icon-strong)" />
      );
    }
    return <IconElement width={14} height={14} color="#F6430D" />;
  }, [status, isPlaying, permissionState, recorderIcon]);

  const ButtonContent = useMemo(() => {
    if (permissionState === 'denied') {
      return 'Microphone permission denied';
    } else if (['recording', 'paused', 'stopping', 'stopped'].includes(status)) {
      return (
        <div className="audio-recorder-timer-container">
          {status === 'stopped' && (
            <>
              <RecordTimer isRunning={isPlaying} key={playTimerKey} />/
            </>
          )}

          <RecordTimer isRunning={status === 'recording'} />
        </div>
      );
    } else {
      return label;
    }
  }, [status, isPlaying, playTimerKey, label, permissionState]);

  useBatchedUpdateEffectArray([
    {
      dep: visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  useEffect(() => {
    setExposedVariables(exposedVariablesTemporaryState);
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      });
    }
    return () => {
      stopRecording();
      if (audioRef.current && endedListenerRef.current) {
        audioRef.current.removeEventListener('ended', endedListenerRef.current);
      }
    };
  }, []);

  const wrapperContainerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    padding: '16px',
    boxShadow: boxShadow,
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
  };

  const buttonTextStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: labelColor,
    lineHeight: '20px',
  };

  const ariaLabel = useMemo(() => {
    if (permissionState === 'denied') return 'Microphone permission denied';
    if (status === 'idle') return 'Start recording';
    if (status === 'recording') return 'Pause recording';
    if (status === 'paused') return 'Resume recording';
    if (status === 'stopped') return isPlaying ? 'Pause playback' : 'Play recording';
    return 'Audio recorder';
  }, [status, isPlaying, permissionState]);

  return (
    <div style={wrapperContainerStyle}>
      {exposedVariablesTemporaryState.isLoading ? (
        <div className="audio-recorder-loader-container">
          <Loader color={accentColor} width="36" />
        </div>
      ) : (
        <div className="audio-recorder-button-container">
          <ButtonSolid
            variant="tertiary"
            className="audio-recorder-button"
            size="md"
            onClick={onClick}
            // data-cy={dataCy}
            aria-label={ariaLabel}
          >
            {ButtonIcon}
          </ButtonSolid>
          <span style={buttonTextStyle}>{ButtonContent}</span>
          <div className="save-discard-button-container">
            {status === 'paused' && (
              <>
                <ButtonSolid
                  variant="primary"
                  className="audio-recorder-button"
                  size="md"
                  onClick={onSave}
                  // data-cy={dataCy}
                >
                  <IconCheck width={14} height={14} color="var(--icon-on-solid)" />
                </ButtonSolid>
                <ButtonSolid
                  variant="tertiary"
                  className="audio-recorder-button"
                  size="md"
                  onClick={onReset}
                  // data-cy={dataCy}
                >
                  <IconX width={14} height={14} color="var(--icon-strong)" />
                </ButtonSolid>
              </>
            )}
            {status === 'stopped' && (
              <ButtonSolid variant="tertiary" className="audio-recorder-button" size="md" onClick={onReset}>
                <IconTrash width={14} height={14} color="var(--icon-strong)" />
              </ButtonSolid>
            )}
            {permissionState === 'denied' && (
              <span
                className="permission-denied-text"
                onClick={() => {
                  window.open('https://support.google.com/chrome/answer/2693767', '_blank');
                }}
              >
                Know more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
