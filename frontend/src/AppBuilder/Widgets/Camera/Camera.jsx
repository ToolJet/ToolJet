import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { blobToDataURL } from '@/AppBuilder/_stores/utils';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { Content } from './Content';
import { Footer } from './Footer';
import './camera.scss';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { mapCameraDevices, hasFrontAndBackCameras, isMobileBrowser } from './cameraDevices';

// Mobile cameras are selected by facing direction, not deviceId: iOS lists several
// rear lenses ("Back Ultra Wide Camera", "Back Dual Wide Camera") whose ids are not
// stable across sessions, so `facingMode` is the only reliable front/back switch.

export const Camera = ({ properties, styles, fireEvent, setExposedVariable, setExposedVariables }) => {
  // Props
  const { backgroundColor, borderRadius, borderColor, boxShadow, textColor, accentColor } = styles;
  const { content: contentType, visibility, disabledState } = properties;

  // State
  const [deviceLists, setDeviceLists] = useState({
    cameras: [],
    microphones: [],
  });
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [recordingResult, setRecordingResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isDisabled: disabledState,
  });

  // Refs
  const containerRef = useRef(null);
  const videoElementRef = useRef(null);
  const capturedImageRef = useRef(null);
  const savedImageUrlRef = useRef(null);
  const mediaStreamRef = useRef(null);
  // Set when an in-flight recording must be thrown away (widget hidden/disabled
  // or unmounted mid-recording): the recorder's onStop honors it and skips
  // publishing the result.
  const discardNextStopRef = useRef(false);
  // Which content type produced the currently exposed `value` (Form collection),
  // so resetImage/resetVideo only clear `value` when it is theirs.
  const savedValueKindRef = useRef(null);

  // The CSA-aware visibility/disabled pair: a hidden or disabled Camera must not
  // hold (or acquire) the hardware.
  const isWidgetActive = exposedVariablesTemporaryState.isVisible && !exposedVariablesTemporaryState.isDisabled;

  // Media recorder setup
  const recorderOptions = useMemo(
    () => ({
      audio: true,
      // A fresh object identity ON PURPOSE: react-media-recorder 1.7.2's
      // getMediaStream is a useCallback([audio, video, screen]) whose closure
      // captures `customMediaStream` from the render it was created in. With a
      // stable `video: true` it would keep the mount-time null forever and open
      // its OWN second camera+mic stream that nothing ever stops (the "camera
      // stays on after leaving the page" bug). A new object per stream change
      // re-creates that closure exactly when customMediaStream changes.
      video: {},
      customMediaStream: mediaStream,
      stopStreamsOnStop: false,
      onStart: () => {
        setRecordingResult(null);
        fireEvent('onRecordingStart');
      },
      onStop: (blobUrl, blob) => {
        if (discardNextStopRef.current) {
          discardNextStopRef.current = false;
          return;
        }
        setRecordingResult({ url: blobUrl, blob });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mediaStream, fireEvent]
  );

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error: recorderError,
  } = useReactMediaRecorder(recorderOptions);

  // Helpers
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const updateCapturedImage = useCallback(
    (nextImage, { revokePrevious = true } = {}) => {
      setCapturedImage((previousImage) => {
        if (previousImage?.url && revokePrevious) {
          URL.revokeObjectURL(previousImage.url);
        }
        const resolvedImage = typeof nextImage === 'function' ? nextImage(previousImage) : nextImage;
        capturedImageRef.current = resolvedImage;
        return resolvedImage;
      });
    },
    [capturedImageRef]
  );

  const clearCapturedImage = useCallback(
    ({ revokePrevious = true } = {}) => {
      updateCapturedImage(null, { revokePrevious });
    },
    [updateCapturedImage]
  );

  // Either signal is enough. Labels are blank until permission is granted (and some
  // browsers only ever expose the granted camera), so the front/back pair alone would
  // miss real phones; the browser heuristic alone misses Android "Desktop site" mode
  // and ChromeOS, which report a desktop user agent.
  const isMobile = useMemo(
    () => hasFrontAndBackCameras(deviceLists.cameras) || isMobileBrowser(),
    [deviceLists.cameras]
  );

  const isBusy = useMemo(
    () =>
      status === 'acquiring_media' ||
      status === 'stopping' ||
      status === 'media_in_use' ||
      status === 'delayed_start' ||
      status === 'invalid_media_constraints',
    [status]
  );

  // Event handlers
  const handleCameraSelect = (deviceId) => setSelectedCameraId(deviceId);

  const handleMicrophoneSelect = (deviceId) => setSelectedMicrophoneId(deviceId);

  const handleFlipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const handleClearRecording = () => {
    setRecordingResult(null);
    clearBlobUrl();
  };

  const capturePhoto = async () => {
    const videoElement = videoElementRef.current;
    if (!videoElement) return;

    if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise((resolve) => {
        videoElement.addEventListener('loadeddata', resolve, { once: true });
      });
    }

    const width = videoElement.videoWidth || videoElement.clientWidth;
    const height = videoElement.videoHeight || videoElement.clientHeight;

    if (!width || !height) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to convert canvas to blob'));
      }, 'image/png');
    });

    const url = URL.createObjectURL(blob);
    updateCapturedImage({ blob, url });
  };

  const handleCaptureToggle = async (saveCapture = false) => {
    // A disabled Camera must not capture, save, discard, or record — the wrapper's
    // CSS only blocks the pointer, so keyboard activation lands here.
    if (exposedVariablesTemporaryState.isDisabled) return;

    if (!mediaStream || permissionError || isBusy) {
      if (contentType !== 'image') return;
    }

    if (contentType === 'image') {
      if (typeof saveCapture === 'boolean') {
        if (saveCapture && capturedImage?.blob) {
          if (savedImageUrlRef.current) {
            URL.revokeObjectURL(savedImageUrlRef.current);
            savedImageUrlRef.current = null;
          }
          const blobUrl = URL.createObjectURL(capturedImage.blob);
          savedImageUrlRef.current = blobUrl;
          const dataURL = await blobToDataURL(capturedImage.blob);
          savedValueKindRef.current = 'image';
          setExposedVariables({
            // imageBlobURL: blobUrl,
            imageDataURL: dataURL,
            // `value` is the Form-collected key (user-approved option B): a Form
            // submits the saved capture in its formData.
            value: dataURL,
          });
          fireEvent('onImageSave');
          clearCapturedImage({ revokePrevious: true });
        } else {
          // Discard throws away only the PENDING capture — the previously saved
          // exposure (imageDataURL/value) stays untouched.
          clearCapturedImage({ revokePrevious: true });
        }
        return;
      }

      if (capturedImage) return;

      try {
        await capturePhoto();
      } catch (error) {
        console.error('Failed to capture photo', error);
      }
      return;
    }

    // Video recording logic
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'stopped') {
      if (saveCapture) {
        const dataURL = await blobToDataURL(recordingResult?.blob);
        savedValueKindRef.current = 'video';
        setExposedVariables({
          // videoBlobURL: recordingResult?.url,
          videoDataURL: dataURL,
          value: dataURL,
        });
        fireEvent('onRecordingSave');
      }
      // Discard throws away only the retake — the previously saved exposure
      // (videoDataURL/value) stays untouched.
      handleClearRecording();
    } else if (status === 'idle' || status === 'permission_denied') {
      handleClearRecording();
      startRecording();
    }
  };

  const handleFullscreenToggle = async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen?.();
      } else {
        await element.requestFullscreen?.();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen', error);
    }
  };

  // Exposed variables sync
  useBatchedUpdateEffectArray([
    {
      dep: visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
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
    setExposedVariables({
      ...exposedVariablesTemporaryState,
      value: null,
      resetVideo: () => {
        setExposedVariables({
          // videoBlobURL: null,
          videoDataURL: null,
          ...(savedValueKindRef.current === 'video' && { value: null }),
        });
        if (savedValueKindRef.current === 'video') savedValueKindRef.current = null;
      },
      resetImage: () => {
        setExposedVariables({
          // imageBlobURL: null,
          imageDataURL: null,
          ...(savedValueKindRef.current === 'image' && { value: null }),
        });
        if (savedValueKindRef.current === 'image') savedValueKindRef.current = null;
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', value);
        updateExposedVariablesState('isVisible', value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', value);
        updateExposedVariablesState('isDisabled', value);
      },
    });
  }, []);

  useEffect(() => {
    capturedImageRef.current = capturedImage;
  }, [capturedImage]);

  useEffect(() => {
    return () => {
      if (capturedImageRef.current?.url) {
        URL.revokeObjectURL(capturedImageRef.current.url);
      }
      if (savedImageUrlRef.current) {
        URL.revokeObjectURL(savedImageUrlRef.current);
        savedImageUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (contentType !== 'image' && capturedImage) {
      clearCapturedImage();
    }
  }, [contentType]);

  // Device enumeration. Runs on mount and again once a stream is granted: before the
  // permission prompt is answered browsers anonymise the device list (blank deviceId,
  // blank label, often a single placeholder per kind), so the first pass alone can never
  // populate a usable camera list.
  const refreshDeviceLists = useCallback(async () => {
    const mediaDevices = navigator?.mediaDevices;
    if (!mediaDevices?.enumerateDevices) return;

    try {
      const availableDevices = await mediaDevices.enumerateDevices();

      const cameras = mapCameraDevices(availableDevices.filter((device) => device.kind === 'videoinput'));

      const microphones = availableDevices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          id: device.deviceId || `microphone-${index}`,
          label: device.label || `Microphone ${index + 1}`,
          value: device.deviceId || `microphone-${index}`,
        }));

      setDeviceLists({ cameras, microphones });
      // On mobile the camera is chosen by facing direction, so no deviceId is selected.
      if (!isMobile) {
        setSelectedCameraId((prev) =>
          prev && cameras.some((d) => d.value === prev) ? prev : (cameras[0]?.value ?? null)
        );
      }
      setSelectedMicrophoneId((prev) =>
        prev && microphones.some((d) => d.value === prev) ? prev : (microphones[0]?.value ?? null)
      );
    } catch (error) {
      console.error('Failed to enumerate media devices', error);
    }
  }, [isMobile]);

  useEffect(() => {
    const mediaDevices = navigator?.mediaDevices;
    if (!mediaDevices?.enumerateDevices) return;

    refreshDeviceLists();
    mediaDevices.addEventListener?.('devicechange', refreshDeviceLists);

    return () => mediaDevices.removeEventListener?.('devicechange', refreshDeviceLists);
  }, [refreshDeviceLists]);

  // Media stream acquisition
  useEffect(() => {
    let cancelled = false;

    // A hidden or disabled Camera must not hold the hardware: release whatever
    // is live and acquire nothing until it is visible and enabled again.
    if (!isWidgetActive) {
      const videoElement = videoElementRef.current;
      if (videoElement?.srcObject) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setMediaStream(null);
      return undefined;
    }

    const requestStream = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionError('unsupported');
        setMediaStream(null);
        return;
      }

      // Stopping the old tracks in the cleanup below is not enough: the <video> element
      // still holds them as its srcObject, and mobile browsers refuse to hand out the
      // second camera until that reference is dropped. Detach synchronously and yield a
      // frame so the element has actually released the hardware before we ask again.
      const videoElement = videoElementRef.current;
      if (videoElement?.srcObject) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
      setMediaStream(null);
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (cancelled) return;

      const constraints = {
        // `ideal` rather than `exact`: a device with only one camera still resolves
        // instead of throwing OverconstrainedError.
        video: isMobile
          ? { facingMode: { ideal: facingMode } }
          : selectedCameraId && !selectedCameraId.startsWith?.('camera-')
            ? { deviceId: { exact: selectedCameraId } }
            : true,
        // A photo-only Camera must not ask for (or open) the microphone.
        audio:
          contentType !== 'video'
            ? false
            : selectedMicrophoneId && !selectedMicrophoneId.startsWith?.('microphone-')
              ? { deviceId: { exact: selectedMicrophoneId } }
              : true,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        setPermissionError(null);
        setMediaStream(stream);
        refreshDeviceLists();
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to acquire media stream', error);
        setPermissionError(error?.name || 'permission_denied');
        setMediaStream(null);
      }
    };

    requestStream();

    // Cleanup runs before the next acquisition (and on unmount), so the previous camera
    // is always released first. iOS Safari refuses to hand out a second camera while an
    // earlier stream is still live, which would otherwise break the front/back flip.
    return () => {
      cancelled = true;
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, [selectedCameraId, selectedMicrophoneId, facingMode, isMobile, refreshDeviceLists, isWidgetActive, contentType]);

  // Interrupting an in-flight recording (widget hidden or disabled) discards it
  // silently: the flagged onStop skips publishing, and the pending retake UI is
  // cleared. The saved exposures stay untouched.
  useEffect(() => {
    if (isWidgetActive) return;
    if (status === 'recording' || status === 'paused') {
      discardNextStopRef.current = true;
      stopRecording();
    }
    setRecordingResult(null);
    clearBlobUrl();
    clearCapturedImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWidgetActive]);

  // Unmount mid-recording (page switch) must also discard, not publish.
  useEffect(() => {
    return () => {
      discardNextStopRef.current = true;
    };
  }, []);

  // Fullscreen handling
  useEffect(() => {
    const element = containerRef.current;
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === element);
    };

    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach((event) => document.addEventListener(event, handleFullscreenChange));

    return () => {
      events.forEach((event) => document.removeEventListener(event, handleFullscreenChange));
      if (document.fullscreenElement === element) {
        document.exitFullscreen?.();
      }
    };
  }, []);

  useEffect(() => {
    if (!visibility && document.fullscreenElement === containerRef.current) {
      document.exitFullscreen?.();
    }
  }, [visibility]);

  /* eslint-enable react-hooks/exhaustive-deps */

  // Computed values
  const isDisabled = exposedVariablesTemporaryState.isDisabled;
  const captureDisabled = !mediaStream || !!permissionError || isBusy || isDisabled;
  const hasPendingCapture = contentType === 'image' && !!capturedImage;
  const deviceSelectDisabled = status === 'recording' || isBusy || isDisabled;
  const canFlipCamera = isMobile && !deviceSelectDisabled;
  const fullscreenSupported = document.fullscreenEnabled ?? true;
  const fullscreenDisabled = !fullscreenSupported || permissionError === 'unsupported';

  // Inline styles
  const containerStyle = {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: isFullscreen ? 0 : `${borderRadius}px`,
    display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
    overflow: 'hidden',
    boxShadow,
    '--camera-button-color': backgroundColor,
    '--camera-button-hover-color': getModifiedColor(backgroundColor, 'hover'),
    '--camera-button-active-color': getModifiedColor(backgroundColor, 'active'),
    '--camera-accent-color': accentColor,
    '--camera-accent-color-hover': getModifiedColor(accentColor, 'hover'),
    '--camera-accent-color-active': getModifiedColor(accentColor, 'active'),
  };

  // Render
  return (
    <div
      ref={containerRef}
      className={`camera-container${isFullscreen ? ' camera-container--fullscreen' : ''}`}
      style={containerStyle}
      data-permission-error={permissionError || undefined}
    >
      <Content
        stream={mediaStream}
        recordingUrl={recordingResult?.url || mediaBlobUrl}
        status={status}
        permissionError={permissionError || recorderError}
        contentType={contentType}
        capturedImageUrl={capturedImage?.url}
        videoRef={videoElementRef}
        textColor={textColor}
        accentColor={accentColor}
      />
      <Footer
        cameraDevices={deviceLists.cameras}
        microphoneDevices={deviceLists.microphones}
        selectedCameraId={selectedCameraId}
        selectedMicrophoneId={selectedMicrophoneId}
        onCameraSelect={handleCameraSelect}
        onMicrophoneSelect={handleMicrophoneSelect}
        onFlipCamera={handleFlipCamera}
        canFlipCamera={canFlipCamera}
        showFlipCamera={isMobile}
        onCaptureToggle={handleCaptureToggle}
        recordingStatus={status}
        captureDisabled={captureDisabled}
        deviceSelectDisabled={deviceSelectDisabled}
        onFullscreenToggle={handleFullscreenToggle}
        fullscreenDisabled={fullscreenDisabled}
        isFullscreen={isFullscreen}
        recorderError={recorderError}
        permissionError={permissionError}
        contentType={contentType}
        hasPendingCapture={hasPendingCapture}
        accentColor={accentColor}
      />
    </div>
  );
};
