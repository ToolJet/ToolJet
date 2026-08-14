import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReactMediaRecorder } from 'react-media-recorder';
import { blobToDataURL } from '@/AppBuilder/_stores/utils';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { Content } from './Content';
import { Footer } from './Footer';
import './camera.scss';
import { getModifiedColor } from '@/AppBuilder/Widgets/utils';
import { mapCameraDevices, hasFrontAndBackCameras, isMobileBrowser } from './cameraDevices';
import {
  FULLSCREEN_CHANGE_EVENTS,
  getFullscreenElement,
  shouldUseCssFullscreenFallback,
  toggleNativeFullscreen,
} from './cameraFullscreen';

// Mobile cameras are selected by facing direction, not deviceId: iOS lists several
// rear lenses ("Back Ultra Wide Camera", "Back Dual Wide Camera") whose ids are not
// stable across sessions, so `facingMode` is the only reliable front/back switch.

// TEMPORARY: surfaces camera failures on phones, where the console is unreachable.
// Delete this block and its three call sites before merging.
const alertedMessages = new Set();
const debugAlert = (headline, details = '') => {
  const message = `[camera] ${headline}\n${details}`;
  if (alertedMessages.has(message)) return;
  alertedMessages.add(message);
  window.alert(message);
};

// Canvas ancestors use transform (widget translate + translateZ(0)), which makes
// position:fixed relative to the widget instead of the viewport. Keep a stable
// portal node and reparent it to document.body so the video element never remounts.
const useReparentablePortal = (attachToBody) => {
  const slotRef = useRef(null);
  const [portalNode] = useState(() => {
    if (typeof document === 'undefined') return null;
    const node = document.createElement('div');
    node.className = 'camera-portal-root';
    return node;
  });

  useLayoutEffect(() => {
    if (!portalNode) return undefined;
    const parent = attachToBody ? document.body : slotRef.current;
    if (!parent) return undefined;
    if (portalNode.parentNode !== parent) {
      parent.appendChild(portalNode);
    }
    portalNode.classList.toggle('camera-portal-root--fullscreen', attachToBody);
    return undefined;
  }, [attachToBody, portalNode]);

  useEffect(() => () => portalNode?.remove(), [portalNode]);

  return { slotRef, portalNode };
};

export const Camera = ({ properties, styles, fireEvent, setExposedVariable, setExposedVariables }) => {
  // Props
  const { backgroundColor, borderRadius, borderColor, boxShadow, textColor, accentColor } = styles;
  const { content: contentType, visibility, disabledState } = properties;

  // State
  const [deviceLists, setDeviceLists] = useState({ cameras: [], microphones: [] });
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [recordingResult, setRecordingResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);
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
  const { slotRef, portalNode } = useReparentablePortal(isCssFullscreen);

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
    if (isCssFullscreen) {
      setIsCssFullscreen(false);
      return;
    }

    if (!shouldUseCssFullscreenFallback()) {
      const element = containerRef.current;
      if (element) {
        try {
          const usedNative = await toggleNativeFullscreen(element);
          if (usedNative) return;
        } catch (error) {
          console.error('Failed to toggle fullscreen', error);
        }
      }
    }

    setIsCssFullscreen(true);
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
      resetVideo: () => {
        setExposedVariables({
          // videoBlobURL: null,
          videoDataURL: null,
        });
      },
      resetImage: () => {
        setExposedVariables({
          // imageBlobURL: null,
          imageDataURL: null,
        });
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
          prev && cameras.some((d) => d.value === prev) ? prev : cameras[0]?.value ?? null
        );
      }
      setSelectedMicrophoneId((prev) =>
        prev && microphones.some((d) => d.value === prev) ? prev : microphones[0]?.value ?? null
      );
    } catch (error) {
      console.error('Failed to enumerate media devices', error);
      debugAlert(`enumerateDevices failed — ${error?.name || 'UnknownError'}`, error?.message || '');
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

    const requestStream = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionError('unsupported');
        setMediaStream(null);
        debugAlert('getUserMedia unavailable', `secure context: ${window.isSecureContext}`);
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

        mediaStreamRef.current = stream;
        setPermissionError(null);
        setMediaStream(stream);
        refreshDeviceLists();
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to acquire media stream', error);
        debugAlert(
          `${error?.name || 'UnknownError'}: ${error?.message || ''}`,
          [
            `isMobile: ${isMobile}`,
            `facingMode: ${facingMode}`,
            `video constraint: ${JSON.stringify(constraints.video)}`,
            `cameras: ${deviceLists.cameras.map((c) => `${c.label} [${c.facing}]`).join(' | ') || 'none'}`,
          ].join('\n')
        );
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
  }, [selectedCameraId, selectedMicrophoneId, facingMode, isMobile, refreshDeviceLists]);

  // Fullscreen handling
  useEffect(() => {
    const element = containerRef.current;
    const handleFullscreenChange = () => {
      setIsNativeFullscreen(getFullscreenElement() === element);
    };

    FULLSCREEN_CHANGE_EVENTS.forEach((event) => document.addEventListener(event, handleFullscreenChange));

    return () => {
      FULLSCREEN_CHANGE_EVENTS.forEach((event) => document.removeEventListener(event, handleFullscreenChange));
      if (getFullscreenElement() === element) {
        toggleNativeFullscreen(element).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (visibility) return;
    if (getFullscreenElement() === containerRef.current) {
      toggleNativeFullscreen(containerRef.current).catch(() => {});
    }
    if (isCssFullscreen) setIsCssFullscreen(false);
  }, [visibility, isCssFullscreen]);

  useEffect(() => {
    if (!isCssFullscreen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsCssFullscreen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isCssFullscreen]);

  useLayoutEffect(() => {
    if (!isCssFullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [isCssFullscreen]);

  // iOS can detach a live <video> srcObject when its ancestor is moved in the DOM.
  useLayoutEffect(() => {
    const videoElement = videoElementRef.current;
    const stream = mediaStreamRef.current;
    if (!videoElement || !stream) return;
    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }
    const playPromise = videoElement.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }, [isCssFullscreen]);

  /* eslint-enable react-hooks/exhaustive-deps */

  // Computed values
  const captureDisabled = !mediaStream || !!permissionError || isBusy;
  const hasPendingCapture = contentType === 'image' && !!capturedImage;
  const deviceSelectDisabled = status === 'recording' || isBusy;
  const canFlipCamera = isMobile && !deviceSelectDisabled;
  const isFullscreen = isNativeFullscreen || isCssFullscreen;

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
  const camera = (
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
        fullscreenDisabled={false}
        isFullscreen={isFullscreen}
        recorderError={recorderError}
        permissionError={permissionError}
        contentType={contentType}
        hasPendingCapture={hasPendingCapture}
        accentColor={accentColor}
      />
    </div>
  );

  if (!portalNode) return camera;

  return (
    <>
      <div ref={slotRef} className="camera-slot" />
      {createPortal(camera, portalNode)}
    </>
  );
};
