import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { blobToDataURL } from '@/AppBuilder/_stores/utils';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { Content } from './Content';
import { Footer } from './Footer';
import './camera.scss';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/mediaC';

export const Camera = ({
  id,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  componentType,
  moduleId,
  resolveIndex,
}) => {
  // Props
  const { backgroundColor, borderRadius, borderColor, boxShadow, textColor, accentColor } = styles;
  const { content: contentType, visibility, disabledState } = properties;

  // State
  const [deviceLists, setDeviceLists] = useState({ cameras: [], microphones: [] });
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [recordingResult, setRecordingResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Controlled: exposed flags are read from the store (resolved props are the
  // pre-first-publish fallbacks).
  const isVisible = useExposedVariable(id, 'isVisible', { resolveIndex, moduleId }, visibility);

  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Refs
  const containerRef = useRef(null);
  const videoElementRef = useRef(null);
  const capturedImageRef = useRef(null);
  const savedImageUrlRef = useRef(null);

  // Media recorder setup
  const recorderOptions = useMemo(
    () => ({
      audio: true,
      video: true,
      customMediaStream: mediaStream,
      stopStreamsOnStop: false,
      onStart: () => {
        setRecordingResult(null);
        fireEvent('onRecordingStart');
      },
      onStop: (blobUrl, blob) => {
        setRecordingResult({ url: blobUrl, blob });
      },
    }),
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
          setExposedVariables({
            // imageBlobURL: blobUrl,
            imageDataURL: dataURL,
          });
          fireEvent('onImageSave');
          clearCapturedImage({ revokePrevious: true });
        } else {
          if (savedImageUrlRef.current) {
            URL.revokeObjectURL(savedImageUrlRef.current);
            savedImageUrlRef.current = null;
          }
          setExposedVariables({
            // imageBlobURL: null,
            imageDataURL: null,
          });
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
        setExposedVariables({
          // videoBlobURL: recordingResult?.url,
          videoDataURL: dataURL,
        });
        fireEvent('onRecordingSave');
      } else {
        setExposedVariables({
          // videoBlobURL: null,
          videoDataURL: null,
        });
      }
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

  // Exposed variables sync — write-throughs (store-read state renders them).
  useBatchedUpdateEffectArray([
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  // Effects
  /* eslint-disable react-hooks/exhaustive-deps */

  // Mount: initial exposed snapshot + contract-generated CSA shims.
  // resetVideo/resetImage only null the exposed data URLs (no stream/recorder
  // teardown) so they are contract reducers, not widget effects.
  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      ...csaShims(),
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

  // Device enumeration
  useEffect(() => {
    const mediaDevices = navigator?.mediaDevices;
    if (!mediaDevices?.enumerateDevices) return;

    let isMounted = true;

    const updateDeviceLists = async () => {
      try {
        const availableDevices = await mediaDevices.enumerateDevices();

        const cameras = availableDevices
          .filter((device) => device.kind === 'videoinput')
          .map((device, index) => ({
            id: device.deviceId || `camera-${index}`,
            label: device.label || `Camera ${index + 1}`,
            value: device.deviceId || `camera-${index}`,
          }));

        const microphones = availableDevices
          .filter((device) => device.kind === 'audioinput')
          .map((device, index) => ({
            id: device.deviceId || `microphone-${index}`,
            label: device.label || `Microphone ${index + 1}`,
            value: device.deviceId || `microphone-${index}`,
          }));

        if (isMounted) {
          setDeviceLists({ cameras, microphones });
          setSelectedCameraId((prev) =>
            prev && cameras.some((d) => d.value === prev) ? prev : cameras[0]?.value ?? null
          );
          setSelectedMicrophoneId((prev) =>
            prev && microphones.some((d) => d.value === prev) ? prev : microphones[0]?.value ?? null
          );
        }
      } catch (error) {
        console.error('Failed to enumerate media devices', error);
      }
    };

    updateDeviceLists();
    mediaDevices.addEventListener?.('devicechange', updateDeviceLists);

    return () => {
      isMounted = false;
      mediaDevices.removeEventListener?.('devicechange', updateDeviceLists);
    };
  }, []);

  // Media stream acquisition
  useEffect(() => {
    let cancelled = false;

    const requestStream = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionError('unsupported');
        setMediaStream((prev) => {
          prev?.getTracks().forEach((track) => track.stop());
          return null;
        });
        return;
      }

      const constraints = {
        video:
          selectedCameraId && !selectedCameraId.startsWith?.('camera-')
            ? { deviceId: { exact: selectedCameraId } }
            : true,
        audio:
          selectedMicrophoneId && !selectedMicrophoneId.startsWith?.('microphone-')
            ? { deviceId: { exact: selectedMicrophoneId } }
            : true,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setPermissionError(null);
        setMediaStream((prev) => {
          if (prev && prev !== stream) {
            prev.getTracks().forEach((track) => track.stop());
          }
          return stream;
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to acquire media stream', error);
        setPermissionError(error?.name || 'permission_denied');
        setMediaStream((prev) => {
          prev?.getTracks().forEach((track) => track.stop());
          return null;
        });
      }
    };

    requestStream();

    return () => {
      cancelled = true;
    };
  }, [selectedCameraId, selectedMicrophoneId]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, [mediaStream]);

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
  const captureDisabled = !mediaStream || !!permissionError || isBusy;
  const hasPendingCapture = contentType === 'image' && !!capturedImage;
  const deviceSelectDisabled = status === 'recording' || isBusy;
  const fullscreenSupported = document.fullscreenEnabled ?? true;
  const fullscreenDisabled = !fullscreenSupported || permissionError === 'unsupported';

  // Inline styles
  const containerStyle = {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: isFullscreen ? 0 : `${borderRadius}px`,
    display: isVisible ? 'flex' : 'none',
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
