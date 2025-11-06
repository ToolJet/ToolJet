import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import './audioRecorder.scss';
import RecorderActionIcon from './RecorderActionIcon';
import RecorderStatusDisplay from './RecorderStatusDisplay';
import RecorderActions from './RecorderActions';
import Waveform from './Waveform';
import { blobToDataURL, blobToBinary } from './utils';
import * as Icons from '@tabler/icons-react';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import Loader from '@/ToolJetUI/Loader/Loader';

export const AudioRecorder = ({
  styles,
  properties,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  dataCy: _dataCy,
}) => {
  // Props
  const { recorderIcon, labelColor, accentColor, backgroundColor, borderColor, borderRadius, boxShadow } = styles;
  const { label, loadingState, disabledState, visibility } = properties;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTimerKey, setPlayTimerKey] = useState(0);
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionState, setPermissionState] = useState('granted');
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
  });

  // Refs
  const audioRef = useRef(null);
  const endedListenerRef = useRef(null);

  // Media recorder setup
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

  // Icons
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[recorderIcon] == undefined ? Icons['IconMicrophone'] : Icons[recorderIcon];

  // Helpers
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const openMicPermissionsHelp = () => {
    window.open('https://support.google.com/chrome/answer/2693767', '_blank');
  };

  // Event handlers
  const onClick = async () => {
    if (status === 'idle') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
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
    // Ensure we have a playable source
    if (!mediaBlobUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // If src differs or was cleared, set it and reload element state
    if (audioRef.current.src !== mediaBlobUrl) {
      audioRef.current.src = mediaBlobUrl;
      // Calling load ensures the browser re-evaluates the new source
      audioRef.current.load();
    }

    // Play and update UI state
    const playPromise = audioRef.current.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Swallow NotSupported/NotAllowed errors triggered by rapid replays
      });
    }
    setIsPlaying(true);

    // Rebind ended listener to reset UI on playback completion
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
      // stop and reset playback
      audioRef.current.pause();
      audioRef.current.src = ''; // clear source safely
      audioRef.current.load(); // reset element state

      if (endedListenerRef.current) {
        audioRef.current.removeEventListener('ended', endedListenerRef.current);
        endedListenerRef.current = null;
      }
    }

    setIsPlaying(false);
  };

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

  // Effects
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setExposedVariables(exposedVariablesTemporaryState);
    // if (navigator.permissions) {
    //   navigator.permissions.query({ name: 'microphone' }).then((result) => {
    //     setPermissionState(result.state);
    //     result.onchange = () => setPermissionState(result.state);
    //   });
    // }
    return () => {
      stopRecording();
      if (audioRef.current && endedListenerRef.current) {
        audioRef.current.removeEventListener('ended', endedListenerRef.current);
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Inline styles
  const wrapperContainerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    padding: '16px',
    boxShadow: boxShadow,
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
    overflow: 'hidden',
  };

  const buttonTextStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: labelColor,
    lineHeight: '20px',
  };

  // Aria labels
  const ariaLabel = useMemo(() => {
    if (permissionState === 'denied') return 'Microphone permission denied';
    if (status === 'idle') return 'Start recording';
    if (status === 'recording') return 'Pause recording';
    if (status === 'paused') return 'Resume recording';
    if (status === 'stopped') return isPlaying ? 'Pause playback' : 'Play recording';
    return 'Audio recorder';
  }, [status, isPlaying, permissionState]);

  // Render
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
            aria-label={ariaLabel}
          >
            <RecorderActionIcon
              permissionState={permissionState}
              status={status}
              isPlaying={isPlaying}
              IconElement={IconElement}
            />
          </ButtonSolid>
          <span style={buttonTextStyle}>
            <RecorderStatusDisplay
              permissionState={permissionState}
              status={status}
              isPlaying={isPlaying}
              playTimerKey={playTimerKey}
              label={label}
            />
          </span>
          {status !== 'idle' && (
            <Waveform
              status={status}
              mediaStream={mediaStream}
              blobUrl={mediaBlobUrl}
              isPlaying={isPlaying}
              audioRef={audioRef}
            />
          )}
          <div className="save-discard-button-container">
            <RecorderActions
              status={status}
              permissionState={permissionState}
              onSave={onSave}
              onReset={onReset}
              openMicPermissionsHelp={openMicPermissionsHelp}
            />
          </div>
        </div>
      )}
    </div>
  );
};
