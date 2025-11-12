import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './camera.scss';
import { Content } from './Content';
import { Footer } from './Footer';
import { useReactMediaRecorder } from 'react-media-recorder';
import { blobToDataURL, blobToBinary } from '@/AppBuilder/_stores/utils';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

export const Camera = ({ properties, styles, fireEvent, setExposedVariable, setExposedVariables }) => {
  const { backgroundColor, borderRadius, borderColor } = styles;
  const { content: contentType, visibility, disabledState } = properties;
  const [deviceLists, setDeviceLists] = useState({ cameras: [], microphones: [] });
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [recordingResult, setRecordingResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const videoElementRef = useRef(null);
  const capturedImageRef = useRef(null);
  const savedImageUrlRef = useRef(null);
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isDisabled: disabledState,
  });

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
  }, [capturedImage, clearCapturedImage, contentType]);

  useEffect(() => {
    const mediaDevices = navigator?.mediaDevices;
    if (!mediaDevices || !mediaDevices.enumerateDevices) {
      return;
    }

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
          setSelectedCameraId((prevSelected) => {
            if (prevSelected && cameras.some((device) => device.value === prevSelected)) {
              return prevSelected;
            }
            return cameras[0]?.value ?? null;
          });
          setSelectedMicrophoneId((prevSelected) => {
            if (prevSelected && microphones.some((device) => device.value === prevSelected)) {
              return prevSelected;
            }
            return microphones[0]?.value ?? null;
          });
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

  useEffect(() => {
    let cancelled = false;

    const requestStream = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionError('unsupported');
        setMediaStream((prevStream) => {
          if (prevStream) {
            prevStream.getTracks().forEach((track) => track.stop());
          }
          return null;
        });
        return;
      }

      const constraints = {
        video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
        audio: selectedMicrophoneId ? { deviceId: { exact: selectedMicrophoneId } } : true,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setPermissionError(null);
        setMediaStream((previousStream) => {
          if (previousStream && previousStream !== stream) {
            previousStream.getTracks().forEach((track) => track.stop());
          }
          return stream;
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to acquire media stream', error);
        setPermissionError(error?.name || 'permission_denied');
        setMediaStream((previousStream) => {
          if (previousStream) {
            previousStream.getTracks().forEach((track) => track.stop());
          }
          return null;
        });
      }
    };

    requestStream();

    return () => {
      cancelled = true;
    };
  }, [selectedCameraId, selectedMicrophoneId]);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

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

  const handleCameraSelect = (deviceId) => {
    setSelectedCameraId(deviceId);
  };

  const handleMicrophoneSelect = (deviceId) => {
    setSelectedMicrophoneId(deviceId);
  };

  const handleClearRecording = () => {
    setRecordingResult(null);
    clearBlobUrl();
  };

  const isBusy = useMemo(
    () =>
      status === 'acquiring_media' ||
      status === 'stopping' ||
      status === 'media_in_use' ||
      status === 'delayed_start' ||
      status === 'invalid_media_constraints',
    [status]
  );

  const capturePhoto = async () => {
    const videoElement = videoElementRef.current;
    if (!videoElement) {
      console.warn('Unable to capture photo: video element not ready.');
      return;
    }

    if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise((resolve) => {
        const handler = () => {
          videoElement.removeEventListener('loadeddata', handler);
          resolve();
        };
        videoElement.addEventListener('loadeddata', handler, { once: true });
      });
    }

    const width = videoElement.videoWidth || videoElement.clientWidth;
    const height = videoElement.videoHeight || videoElement.clientHeight;

    if (!width || !height) {
      console.warn('Unable to capture photo: video dimensions unavailable.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      console.warn('Unable to capture photo: canvas context missing.');
      return;
    }
    context.drawImage(videoElement, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });

    const url = URL.createObjectURL(blob);
    updateCapturedImage({ blob, url });
  };

  const handleCaptureToggle = async (saveCapture = false) => {
    if (!mediaStream || permissionError || isBusy) {
      if (contentType !== 'image') {
        return;
      }
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
          const rawBinary = await blobToBinary(capturedImage.blob);
          setExposedVariables({
            imageBlobURL: blobUrl,
            imageDataURL: dataURL,
            imageRawBinary: rawBinary,
          });
          fireEvent('onPhotoCapture');
          clearCapturedImage({ revokePrevious: true });
        } else {
          if (savedImageUrlRef.current) {
            URL.revokeObjectURL(savedImageUrlRef.current);
            savedImageUrlRef.current = null;
          }
          setExposedVariables({
            imageBlobURL: null,
            imageDataURL: null,
            imageRawBinary: null,
          });
          clearCapturedImage({ revokePrevious: true });
        }
        return;
      }

      if (capturedImage) {
        return;
      }

      try {
        await capturePhoto();
      } catch (error) {
        console.error('Failed to capture photo', error);
      }
      return;
    }

    if (status === 'recording') {
      stopRecording();
    } else if (status === 'paused') {
      // Nothing for now
    } else if (status === 'stopped') {
      if (saveCapture) {
        const dataURL = await blobToDataURL(recordingResult?.blob);
        const rawBinary = await blobToBinary(recordingResult?.blob);
        setExposedVariables({
          videoBlobURL: recordingResult?.url,
          videoDataURL: dataURL,
          videoRawBinary: rawBinary,
        });
        fireEvent('onRecordingStop');
      } else {
        setExposedVariables({
          videoBlobURL: null,
          videoDataURL: null,
          videoRawBinary: null,
        });
      }
      handleClearRecording();
    } else if (status === 'idle' || status === 'permission_denied') {
      handleClearRecording();
      startRecording();
    }
  };

  useEffect(() => {
    const element = containerRef.current;
    const handleFullscreenChange = () => {
      const currentlyFullscreen = document.fullscreenElement === element;
      setIsFullscreen(currentlyFullscreen);
    };

    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];

    events.forEach((eventName) => document.addEventListener(eventName, handleFullscreenChange));

    return () => {
      events.forEach((eventName) => document.removeEventListener(eventName, handleFullscreenChange));
      if (document.fullscreenElement === element) {
        document.exitFullscreen?.();
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible && document.fullscreenElement === containerRef.current) {
      document.exitFullscreen?.();
    }
  }, [isVisible]);

  const requestElementFullscreen = async (element) => {
    if (!element) return;
    const request =
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen;
    if (!request) return;
    const maybePromise = request.call(element);
    if (maybePromise && typeof maybePromise.then === 'function') {
      await maybePromise;
    }
  };

  const exitFullscreen = async () => {
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;
    if (!exit) return;
    const maybePromise = exit.call(document);
    if (maybePromise && typeof maybePromise.then === 'function') {
      await maybePromise;
    }
  };

  const handleFullscreenToggle = async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement === element) {
        await exitFullscreen();
      } else {
        await requestElementFullscreen(element);
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen', error);
    }
  };

  useEffect(() => {
    setExposedVariables(exposedVariablesTemporaryState);
  }, []);

  const computedContainerStyles = {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
  };
  const isVisible = properties?.visibility ?? true;
  const captureDisabled = !mediaStream || !!permissionError || isBusy;
  const hasPendingCapture = contentType === 'image' && !!capturedImage;

  const deviceSelectDisabled = status === 'recording' || isBusy;
  const fullscreenSupported =
    typeof document !== 'undefined' && (document.fullscreenEnabled === undefined ? true : document.fullscreenEnabled);
  const fullscreenDisabled = !fullscreenSupported || permissionError === 'unsupported';
  const containerClassName = `camera-container${isFullscreen ? ' camera-container--fullscreen' : ''}`;

  const containerStyle = {
    ...computedContainerStyles,
    display: isVisible ? 'flex' : 'none',
    ...(isFullscreen && { borderRadius: 0 }),
  };

  return (
    <div
      ref={containerRef}
      className={containerClassName}
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
      />
    </div>
  );
};
