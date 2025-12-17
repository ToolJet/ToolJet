import React, { useEffect, useMemo, useRef } from 'react';
import { Video } from 'lucide-react';

const playVideo = (videoElement) => {
  if (!videoElement) return;
  const promise = videoElement.play();
  if (promise && typeof promise.catch === 'function') {
    promise.catch(() => {
      /* Swallow autoplay errors */
    });
  }
};

export const Content = ({
  stream,
  recordingUrl,
  status,
  permissionError,
  contentType,
  capturedImageUrl,
  videoRef,
  textColor,
  accentColor,
}) => {
  const internalVideoRef = useRef(null);
  const resolvedVideoRef = videoRef ?? internalVideoRef;

  useEffect(() => {
    const videoElement = resolvedVideoRef.current;
    if (!videoElement) return;

    if (contentType === 'image' && capturedImageUrl) {
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
      if (videoElement.src) {
        videoElement.pause();
        videoElement.removeAttribute('src');
        videoElement.load();
      }
      return;
    }

    const shouldShowPreview = stream && status !== 'stopped' && status !== 'stopping' && status !== 'permission_denied';

    if (shouldShowPreview) {
      if (videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
      if (videoElement.src) {
        videoElement.pause();
        videoElement.removeAttribute('src');
        videoElement.load();
      }
      playVideo(videoElement);
      return;
    }

    videoElement.srcObject = null;

    if (recordingUrl) {
      if (videoElement.src !== recordingUrl) {
        videoElement.src = recordingUrl;
        videoElement.load();
      }
      // Only auto-play if recording is not stopped (i.e., during preview)
      if (status !== 'stopped') {
        playVideo(videoElement);
      }
      return;
    }

    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.load();
  }, [stream, recordingUrl, status, contentType, capturedImageUrl, resolvedVideoRef]);

  useEffect(() => {
    const element = resolvedVideoRef.current;
    return () => {
      if (!element) return;
      element.pause();
      element.srcObject = null;
      element.removeAttribute('src');
    };
  }, [resolvedVideoRef]);

  const hasVideo = !!stream || !!recordingUrl;
  const showCapturedImage = contentType === 'image' && !!capturedImageUrl;

  const placeholderMessage = useMemo(() => {
    if (!permissionError) return 'Camera preview will appear here once available.';

    if (
      permissionError === 'NotAllowedError' ||
      permissionError === 'PermissionDeniedError' ||
      permissionError === 'permission_denied'
    ) {
      return 'Camera permission denied.';
    }

    if (permissionError === 'unsupported') {
      return 'Camera preview is not supported in this browser.';
    }

    if (permissionError === 'NotFoundError' || permissionError === 'no_specified_media_found') {
      return 'No camera device found. Please connect a camera and try again.';
    }

    return 'Camera preview is not available.';
  }, [permissionError]);

  const openCameraPermissionsHelp = () => {
    window.open('https://support.google.com/chrome/answer/2693767', '_blank');
  };

  const showLearnMore =
    permissionError === 'NotAllowedError' ||
    permissionError === 'PermissionDeniedError' ||
    permissionError === 'permission_denied';

  return (
    <div className="camera-content">
      {showCapturedImage ? (
        <img src={capturedImageUrl} alt="Captured frame" className="camera-content-image" />
      ) : hasVideo ? (
        <video
          ref={resolvedVideoRef}
          className="camera-content-video"
          playsInline
          autoPlay={status !== 'stopped'}
          muted={status !== 'stopped'}
          controls={status === 'stopped' && !!recordingUrl}
        />
      ) : (
        <div className="camera-content-placeholder-container">
          <Video width={40} height={28} color="var(--icon-weak)" />
          <div className="camera-content-placeholder" style={{ color: textColor }}>
            {placeholderMessage}
          </div>
          {showLearnMore && (
            <span
              className="camera-content-learn-more"
              style={{ color: accentColor }}
              onClick={openCameraPermissionsHelp}
            >
              Learn more
            </span>
          )}
        </div>
      )}
    </div>
  );
};
